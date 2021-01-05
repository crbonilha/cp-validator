import assert from "assert";

import * as execHelper from "../libs/exec-helper";
import * as util from "../libs/util";
import Cache from "../libs/cache";
import TestCase from "./test-case";
import { DownloadInterface } from "./tree";


export default class Solution {
	readonly sha:  string;
	readonly name: string;

	readonly language:         string;
	readonly filePath:         string;
	readonly compiledFilePath: string;


	constructor(
		sha:  string,
		name: string
	) {
		this.sha  = sha;
		this.name = name;

		this.language         = util.getLanguage(this.name);
		this.filePath         = Cache.getFilePath(this.sha, this.name);
		this.compiledFilePath = execHelper.getCompileOutputPath(this.filePath);
	}


	isDownloaded(): boolean {
		return Cache.fileAtPathExists(this.filePath);
	}


	isCompiled(): boolean {
		return Cache.fileAtPathExists(this.compiledFilePath);
	}


	download(
		downloadCallback: () => Promise<DownloadInterface>
	): Promise<void> {
		if(!this.isDownloaded()) {
			return Cache.checkAndMaybeDownload(
				this.sha,
				this.name,
				downloadCallback
			);
		}

		return Promise.resolve();
	}


	async compile(): Promise<void> {
		assert(this.isDownloaded(), `Trying to compile solution ${ this.name } before downloading it.`);

		if(!this.isCompiled()) {
			await execHelper.compile(
				this.filePath,
				this.language
			);
		}
	}


	async run(
		testCase: TestCase
	): Promise<execHelper.RunResult> {
		assert(this.isDownloaded(), `Trying to run solution ${ this.name } before downloading it.`);
		assert(this.isCompiled(), `Trying to run solution ${ this.name } before compiling it.`);
		assert(testCase.isDownloaded(),
			`Trying to run solution ${ this.name } on an input that hasn't yet been downloaded.`);

		const runResponse: execHelper.RunResult = await execHelper.run(
			this.compiledFilePath,
			testCase.filePath
		);

		return runResponse;
	}
}

