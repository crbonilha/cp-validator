const execHelper = require('./exec-helper');
const util       = require('./util');

class Solution {
	constructor(
			name,
			content,
			language,
			verbose = false) {
		this.name     = name;
		this.content  = content;
		this.language = language;
		this.verbose  = verbose;
	}

	async init() {
		this.filePath = await util.writeFile(
			this.content,
			`.${ this.language }`,
			this.verbose
		);
	}
	
	async compile() {
		if(this.filePath === undefined) {
			throw `Trying to compile solution before writing it to code.
				Please call init first.`;
		}

		const compileResponse = await execHelper.compile(
			this.filePath,
			this.language,
			this.verbose
		);

		this.binPath = compileResponse.binPath;
	}

	async run(
			testCase) {
		if(this.binPath === undefined) {
			throw `Trying to run solution before compiling it.
				Please compile it first.`;
		}

		const runResponse = await execHelper.run(
			this.binPath,
			testCase.filePath,
			this.verbose
		);

		return runResponse;
	}
}

module.exports = Solution;

