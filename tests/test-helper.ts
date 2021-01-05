import fs from "fs";

import { DownloadInterface } from "../src/models/tree";


export default class TestHelper {
	static readonly testTempDir: string = './temp/test';


	static createFileIfDoesntExist(
		dir:      string,
		fileName: string,
		content:  string
	): string {
		if(!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		const filePath: string = `${ dir }/${ fileName }`;
		fs.writeFileSync(
			filePath,
			content,
			{
				encoding: 'utf8'
			}
		);
		return filePath;
	}


	static deleteFileIfExists(
		dir:      string,
		fileName: string
	): void {
		const filePath: string = `${ dir }/${ fileName }`;

		if(fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}
	}


	static downloadCallback(): Promise<DownloadInterface> {
		return Promise.resolve({
			content:  'dGVzdGluZw==',
			encoding: 'base64'
		});
	}
}

