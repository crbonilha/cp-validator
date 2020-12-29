const cache = require('../libs/cache');
const regex = require('../libs/regex');
const util  = require('../libs/util');

const Solution = require('./solution');
const TestCase = require('./test-case');

class Tree {
	constructor(
			octokit,
			owner,
			repo,
			sha) {
		this.octokit = octokit;
		this.owner   = owner;
		this.repo    = repo;
		this.sha     = sha;
	}

	async init() {
		const response = await this.octokit.git.getTree({
			owner:     this.owner,
			repo:      this.repo,
			tree_sha:  this.sha,
			recursive: true
		});

		this.tree = response.data.tree;

		this.trimTree();

		await this.downloadFiles();
	}

	getBlob(
			file_sha) {
		console.log(`Downloading ${ file_sha }.`);
		return this.octokit.git.getBlob({
			owner:    this.owner,
			repo:     this.repo,
			file_sha: file_sha
		});
	}

	trimTree() {
		if(this.tree === undefined) {
			throw `Trying to download files from tree before initializing the tree.`;
		}

		this.trimmedTree = {
			problems: []
		};

		for (const treeItem of this.tree) {
			if(treeItem.type !== 'blob') {
				continue;
			}

			if(!regex.isSolutionFile(treeItem.path) &&
			!regex.isIoFile(treeItem.path)) {
				continue;
			}

			const problemName = regex.getProblemName(treeItem.path);
			if(!this.trimmedTree.problems.some(p => p.name === problemName)) {
				this.trimmedTree.problems.push({
					name:      problemName,
					io:        [],
					solutions: []
				});
			}
			const problemTree = this.trimmedTree.problems.find(p => p.name === problemName);

			if(regex.isSolutionFile(treeItem.path)) {
				const regexResult = regex.getSolution(treeItem.path);

				problemTree.solutions.push(
					new Solution(
						treeItem.sha,
						util.getFileNameFromPath(treeItem.path)
					)
				);
			}
			else if(regex.isIoFile(treeItem.path)) {
				const regexResult = regex.getIo(treeItem.path);

				if(!problemTree.io.some(io => io.folder === regexResult.folder)) {
					problemTree.io.push({
						folder: regexResult.folder,
						io:     []
					});
				}
				const ioFolder = problemTree.io.find(io => io.folder === regexResult.folder);

				if(!ioFolder.io.some(io => io.number === regexResult.number)) {
					ioFolder.io.push({
						number: regexResult.number
					});
				}
				const ioObj = ioFolder.io.find(io => io.number === regexResult.number);

				ioObj[ regexResult.type ] = new TestCase(
					treeItem.sha,
					`${ ioFolder.folder }-${ ioObj.number }-${ regexResult.type }`,
					regexResult.type
				);
			}
		}
	}

	async downloadFiles() {
		if(this.trimmedTree === undefined) {
			throw `Trying to download files from tree before trimming it.`;
		}

		for (const problem of this.trimmedTree.problems) {
			for (const solution of problem.solutions) {
				await cache.checkAndMaybeDownload(
					solution.sha,
					solution.name,
					this.getBlob.bind(this, solution.sha)
				);
			}

			for (const ioFolder of problem.io) {
				for (const io of ioFolder.io) {
					if(io.in !== undefined) {
						await cache.checkAndMaybeDownload(
							io.in.sha,
							io.in.name,
							this.getBlob.bind(this, io.in.sha)
						);
					}
					if(io.out !== undefined) {
						await cache.checkAndMaybeDownload(
							io.out.sha,
							io.out.name,
							this.getBlob.bind(this, io.out.sha)
						);
					}
				}
			}
		}
	}

	getSolutions(
			problemName) {
		if(this.trimmedTree === undefined) {
			throw `Trying to get solutions before trimming the tree.`;
		}

		const problem = this.trimmedTree.problems.find(problem => problem.name === problemName);
		return problem.solutions;
	}

	getAllIo(
			problemName) {
		if(this.trimmedTree === undefined) {
			throw `Trying to get io before trimming the tree.`;
		}

		const problem = this.trimmedTree.problems.find(problem => problem.name === problemName);
		return problem.io.reduce((acc, cur) => {
			return acc.concat(cur.io);
		}, []);
	}
}

module.exports = Tree;

