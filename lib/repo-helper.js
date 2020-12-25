const Solution = require('./solution');
const TestCase = require('./test-case');
const util     = require('./util');

class RepoHelper {
	constructor(
			octokit,
			owner,
			repo,
			sha,
			verbose = false) {
		this.octokit = octokit;
		this.owner   = owner;
		this.repo    = repo;
		this.sha     = sha;
		this.verbose = verbose;
	}

	decodeResponse(
			encodedMessage) {
		return (new Buffer(encodedMessage, 'base64').toString('ascii'));
	}

	getContent(
			path) {
		return this.octokit.repos.getContent({
			owner: this.owner,
			repo:  this.repo,
			ref:   this.sha,
			path:  path
		});
	}

	async getFileContent(
			path) {
		const result = await this.getContent(path);

		return this.decodeResponse(result.data.content);
	}

	async getSolutions(
			problem) {
		const files = await this.getContent(`problems/${ problem }/solutions`);

		const solutions = [];
		for (const file of files.data) {
			try {
				const newSolution = new Solution(
					file.name,
					await this.getFileContent(
						`problems/${ problem }/solutions/${ file.name }`
					),
					util.getLanguage(file.name),
					this.verbose
				);

				await newSolution.init();

				solutions.push(newSolution);
			} catch(e) {
				console.log(`Failed to create solution ${ file.name }.`);
				console.log(e);
			}
		}
		return solutions;
	}

	async getIoFolderContent(
			path,
			namePrefix = '') {
		const files = await this.getContent(path);

		const ios = [];
		for (const ioFile of files.data) {
			if(ioFile.name.indexOf('.in') !== -1) {
				try {
					const outputFileName =
						ioFile.name.substr(0, ioFile.name.indexOf('.in')) + '.out';

					const inputTestCase = new TestCase(
						namePrefix + ioFile.name,
						await this.getFileContent(
							`${ path }/${ ioFile.name }`
						),
						'input',
						this.verbose
					);
					await inputTestCase.init();

					const outputTestCase = new TestCase(
						namePrefix + outputFileName,
						await this.getFileContent(
							`${ path }/${ outputFileName }`
						),
						'output',
						this.verbose
					);
					await outputTestCase.init();

					ios.push({
						input:  inputTestCase,
						output: outputTestCase
					});
				} catch(e) {
					console.log(`Failed to create io ${ ioFile.name }.`);
					console.log(e);
				}
			}
		}

		return ios;
	}

	async getIos(
			problem) {
		const files = await this.getContent(`problems/${ problem }/io`);

		var ios = [];
		for (const ioFolder of files.data) {
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
		const files = await this.getContent(`problems`);

		const dirs = [];
		for (const file of files.data) {
			if(file.type === 'dir') {
				dirs.push(file.name);
			}
		}

		return dirs;
	}
}

module.exports = RepoHelper;

