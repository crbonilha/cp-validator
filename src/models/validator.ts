import * as execHelper from "../libs/exec-helper";
import * as util from "../libs/util";
import Cache from "../libs/cache";
import TestCase from "./test-case";


export default class Validator {
	readonly sha: string;
	readonly name: string;
	readonly language: string;


	constructor(
		sha:  string,
		name: string
	) {
		this.sha      = sha;
		this.name     = name;
		this.language = util.getLanguage(this.name);
	}


	hasCodeBeenCompiled(): boolean {
		return Cache.fileAtPathExists(
			execHelper.getCompileOutputPath(
				Cache.getFilePath(this.sha, this.name)
			)
		);
	}


	async compile(): Promise<void> {
		if(!Cache.fileExists(this.sha, this.name)) {
			throw `Trying to compile validator before downloading it.`;
		}

		if(!this.hasCodeBeenCompiled()) {
			await execHelper.compile(
				Cache.getFilePath(this.sha, this.name),
				this.language
			);
		}
	}


	async run(
		testCase: TestCase
	): Promise<execHelper.RunResult> {
		if(!this.hasCodeBeenCompiled()) {
			throw `Trying to run validator before compiling it.`;
		}

		const runResponse: execHelper.RunResult = await execHelper.run(
			execHelper.getCompileOutputPath(
				Cache.getFilePath(this.sha, this.name)
			),
			Cache.getFilePath(testCase.sha, testCase.name)
		);

		return runResponse;
	}
}

