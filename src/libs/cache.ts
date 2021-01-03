import * as fs from "fs";

import { decodeResponse } from "./util";


export default class Cache {
	static readonly tempDir: string = './temp';


	static getFilePath(
		sha:      string,
		fileName: string
	): string {
		return `${ Cache.tempDir }/${ sha }-${ fileName }`;
	}


	static fileAtPathExists(
		path: string
	): boolean {
		return fs.existsSync(path);
	}


	static fileExists(
		sha:      string,
		fileName: string
	): boolean {
		return Cache.fileAtPathExists(
			Cache.getFilePath(sha, fileName)
		);
	}


	private static saveFile(
		sha:      string,
		fileName: string,
		content:  string
	): Promise<string> {
		return new Promise((resolve, reject) => {
			if(!fs.existsSync(Cache.tempDir)) {
				fs.mkdirSync(Cache.tempDir);
			}

			const filePath: string = Cache.getFilePath(sha, fileName);

			fs.writeFile(
				filePath,
				content,
				{
					encoding: 'utf8'
				},
				err => {
					if(err) {
						return reject(err);
					}
					resolve(filePath);
				}
			);
		});
	}


	static async checkAndMaybeDownload(
		sha:              string,
		fileName:         string,
		downloadCallback: () => any
	): Promise<void> {
		if(Cache.fileExists(sha, fileName)) {
			return;
		}

		const downloadResult: any = await downloadCallback();
		const decodedResponse: string = decodeResponse(downloadResult.data.content);
		await Cache.saveFile(sha, fileName, decodedResponse);
	}


	static getFileContent(
		sha:      string,
		fileName: string
	): string {
		return fs.readFileSync(
			Cache.getFilePath(sha, fileName),
			{
				encoding: 'utf8'
			}
		);
	}
}

