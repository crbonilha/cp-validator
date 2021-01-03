import * as execHelper from "../libs/exec-helper";
import * as util from "../libs/util";
import Cache from "../libs/cache";
import TestCase from "./test-case";


export default class Validator {
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
			const compileResponse = await execHelper.compile(
				Cache.getFilePath(this.sha, this.name),
				this.language,
				this.verbose
			);
		}
	}


	async run(
		testCase: TestCase
	): Promise<any> {
		if(!this.hasCodeBeenCompiled()) {
			throw `Trying to run validator before compiling it.`;
		}

		const runResponse: any = await execHelper.run(
			execHelper.getCompileOutputPath(
				Cache.getFilePath(this.sha, this.name)
			),
			Cache.getFilePath(testCase.sha, testCase.name),
			this.verbose
		);

		return runResponse;
	}
}

