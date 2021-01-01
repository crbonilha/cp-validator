import * as cache from "../libs/cache";
import * as execHelper from "../libs/exec-helper";
import * as util from "../libs/util";
import TestCase from "./test-case";


export default class Solution {
	readonly sha: string;
	readonly name: string;
	readonly language: string;
	readonly verbose: boolean;


	constructor(
		sha: string,
		name: string,
		verbose: boolean = false
	) {
		this.sha      = sha;
		this.name     = name;
		this.language = util.getLanguage(this.name);
		this.verbose  = verbose;
	}


	hasCodeBeenCompiled(): boolean {
		return cache.fileAtPathExists(
			execHelper.getCompileOutputPath(
				cache.getFilePath(this.sha, this.name)
			)
		);
	}


	async compile(): Promise<void> {
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
		testCase: TestCase
	): Promise<any> {
		if(!this.hasCodeBeenCompiled()) {
			throw `Trying to run solution before compiling it.`;
		}

		const runResponse: any = await execHelper.run(
			execHelper.getCompileOutputPath(
				cache.getFilePath(this.sha, this.name)
			),
			cache.getFilePath(testCase.sha, testCase.name),
			this.verbose
		);

		return runResponse;
	}
}

