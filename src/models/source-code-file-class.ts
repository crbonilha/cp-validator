import assert from "assert";

import * as execHelper from "../libs/exec-helper";
import * as util from "../libs/util";
import Cache from "../libs/cache";
import File from "./file-class";
import TestCase from "./test-case";


export default abstract class SourceCodeFile extends File {
	readonly language:         string;
	readonly compiledFilePath: string;


	constructor(
		sha:  string,
		name: string
	) {
		super(sha, name);

		this.language         = util.getLanguage(this.name);
		this.compiledFilePath = execHelper.getCompileOutputPath(this.filePath);
	}


	isCompiled(): boolean {
		return Cache.fileAtPathExists(this.compiledFilePath);
	}


	async compile(): Promise<void> {
		assert(this.isDownloaded(),
			`Trying to compile source code \'${ this.name }\' before downloading it.`);

		if(this.isCompiled()) {
			return;
		}

		await execHelper.compile(
			this.filePath,
			this.language
		);
	}


	async run(
		testCase: TestCase
	): Promise<execHelper.RunResult> {
		assert(this.isDownloaded(),
			`Trying to run source code \'${ this.name }\' before downloading it.`);
		assert(this.isCompiled(),
			`Trying to run source code \'${ this.name }\' before compiling it.`);
		assert(testCase.isDownloaded(),
			`Trying to run source code \'${ this.name }\' on test case \'${ testCase.name },
			which hasn't yet been downloaded.`);

		const runResponse: execHelper.RunResult = await execHelper.run(
			this.compiledFilePath,
			testCase.filePath
		);

		return runResponse;
	}
}

