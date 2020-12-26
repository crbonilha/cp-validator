const cache = require('./cache');
const regex = require('./regex');
const util  = require('./util');

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
	}

	getBlob(
			file_sha) {
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

				problemTree.solutions.push({
					name: util.getFileNameFromPath(treeItem.path),
					path: treeItem.path,
					sha:  treeItem.sha
				});
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

				ioObj[ regexResult.type ] = {
					name: `${ ioFolder.folder }-${ ioObj.number }-${ regexResult.type }`,
					path: treeItem.path,
					sha:  treeItem.sha
				};
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
}

module.exports = Tree;
