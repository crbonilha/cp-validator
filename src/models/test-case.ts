import assert from "assert";

import Cache from "../libs/cache";


export default class TestCase {
	readonly sha:  string;
	readonly name: string;
	readonly type: string;

	readonly filePath: string;


	constructor(
		sha:  string,
		name: string,
		type: string,
	) {
		this.sha  = sha;
		this.name = name;
		this.type = type;

		this.filePath = Cache.getFilePath(this.sha, this.name);
	}


	isDownloaded(): boolean {
		return Cache.fileAtPathExists(this.filePath);
	}


	getFileContent(): string {
		assert(this.isDownloaded(),
			`Trying to read content from the input ${ this.name } that hasn\'t been downloaded yet.`);

		return Cache.getFileContent(this.sha, this.name);
	}
}

