const cache      = require('../libs/cache');
const execHelper = require('../libs/exec-helper');
const util       = require('../libs/util');

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
			execHelper.getCompileOutputPath(
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
			execHelper.getCompileOutputPath(
				cache.getFilePath(this.sha, this.name)
			),
			cache.getFilePath(testCase.sha, testCase.name),
			this.verbose
		);

		return runResponse;
	}
}

module.exports = Solution;

