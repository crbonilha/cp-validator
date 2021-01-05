import assert from "assert";

import Cache from "../libs/cache";
import { DownloadInterface } from "../models/tree";


export default abstract class File {
	readonly sha:  string;
	readonly name: string;

	readonly filePath: string;


	constructor(
		sha:  string,
		name: string
	) {
		this.sha  = sha;
		this.name = name;

		this.filePath = Cache.getFilePath(this.sha, this.name);
	}


	isDownloaded(): boolean {
		return Cache.fileAtPathExists(this.filePath);
	}


	download(
		downloadCallback: () => Promise<DownloadInterface>
	): Promise<void> {
		if(this.isDownloaded()) {
			return Promise.resolve();
		}

		return Cache.checkAndMaybeDownload(
			this.sha,
			this.name,
			downloadCallback
		);
	}


	getFileContent(): string {
		assert(this.isDownloaded(),
			`Trying to read content from the file \'${ this.name }\',
			which hasn\'t been downloaded yet.`);

		return Cache.getFileContent(this.sha, this.name);
	}
}

