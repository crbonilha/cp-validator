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
		response = await this.octokit.git.getTree({
			owner:     this.owner,
			repo:      this.repo,
			tree_sha:  this.sha,
			recursive: true
		});

		this.tree = response.tree;
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
			if(this.trimmedTree[ problemName ] === undefined) {
				this.trimmedTree[ problemName ] = {
					io:        [],
					solutions: []
				};
			}
			const problemTree = this.trimmedTree[ problemName ];

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
					path: treeItem.path,
					sha:  treeItem.sha
				};
			}
		}
	}

	async downloadFiles() {
		if(this.tree === undefined) {
			throw `Trying to download files from tree before initializing the tree.`;
		}

		for (const treeItem of this.tree) {
			if(treeItem.type !== 'blob') {
				continue;
			}

			const fileName = util.getFileNameFromPath(treeItem.path);

			if(!cache.fileExists(treeItem.sha, fileName)) {
				const blobResponse = await getBlob(treeItem.sha);
				const decodedBlob = util.decodeResponse(blobResponse.content, 'base64');
				await cache.saveFile(treeItem.sha, fileName, decodedBlob);
			}
		} 
	}
}

module.exports = Tree;

