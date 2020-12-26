const cache      = require('./cache');
const execHelper = require('./exec-helper');
const util       = require('./util');

class Solution {
	constructor(
			sha,
			name,
			verbose = false) {
		this.sha      = sha;
		this.name     = name;
		this.language = util.getLanguage(this.name);
		this.verbose  = verbose;
	}

	hasCodeBeenCompiled() {
		return cache.fileAtPathExists(
			execHelper.getCompiledOutputPath(
				cache.getFilePath(this.sha, this.name)
			)
		);
	}

	async compile() {
		if(!cache.fileExists(this.sha, this.name)) {
			throw `Trying to compile solution before downloading it.`;
		}

		if(!this.hasCodeBeenCompiled()) {
			const compileResponse = await execHelper.compile(
				cache.getFilePath(this.sha, this.name),
				this.language,
				this.verbose
			);
		}
	}

	async run(
			testCase) {
		if(!this.hasCodeBeenCompiled()) {
			throw `Trying to run solution before compiling it.`;
		}

		const runResponse = await execHelper.run(
			execHelper.getCompiledOutputPath(
				cache.getFilePath(this.sha, this.name)
			),
			testCase.filePath,
			this.verbose
		);

		return runResponse;
	}
}

module.exports = Solution;

