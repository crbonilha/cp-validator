
class RepoHelper {
	constructor(octokit, owner, repo, sha) {
		this.octokit = octokit;
		this.owner   = owner;
		this.repo    = repo;
		this.sha     = sha;
	}

	decodeResponse(
			encodedMessage) {
		return (new Buffer(encodedMessage, 'base64').toString('ascii'));
	}

	async getFileContent(
			path) {
		const result = await this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  path
		});

		return this.decodeResponse(result.data.content);
	}

	async getSolutions(
			problem) {
		const files = await this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  `problems/${ problem }/solutions`
		});

		const solutions = [];
		for (var file of files.data) {
			solutions.push({
				name:    file.name,
				content: await this.getFileContent(
					`problems/${ problem }/solutions/${ file.name }`
				)
			});
		}

		return solutions;
	}

	async getIoFolderContent(
			path,
			namePrefix = '') {
		const files = await this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  path
		});

		const ios = [];
		for (var ioFile of files.data) {
			if(ioFile.name.indexOf('.in') !== -1) {
				const outputFileName =
					ioFile.name.substr(0, ioFile.name.indexOf('.in')) + '.out';

				ios.push({
					input: {
						name:    namePrefix + ioFile.name,
						content: await this.getFileContent(
							`${ path }/${ ioFile.name }`
						)
					},
					output: {
						name:    namePrefix + outputFileName,
						content: await this.getFileContent(
							`${ path }/${ outputFileName }`
						)
					}
				});
			}
		}

		return ios;
	}

	async getIos(
			problem) {
		const files = await this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  `problems/${ problem }/io`
		});

		var ios = [];
		for (var ioFolder of files.data) {
			if(ioFolder.type === 'file') {
			}
			else if(ioFolder.type === 'dir') {
				ios = ios.concat(
					await this.getIoFolderContent(
						`problems/${ problem }/io/${ ioFolder.name }`,
						`${ ioFolder.name }/`
					)
				);
			}
		}

		return ios;
	}

	async getProblemNames() {
		const files = await this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  `problems`
		});

		const dirs = [];
		for (var file of files.data) {
			if(file.type === 'dir') {
				dirs.push(file.name);
			}
		}

		return dirs;
	}
}

module.exports = RepoHelper;

