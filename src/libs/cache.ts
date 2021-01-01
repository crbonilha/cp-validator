import * as fs from "fs";

import { decodeResponse } from "./util";


const tempDir: string = './temp';


export function getFilePath(
	sha: string,
	fileName: string
): string {
	return `${ tempDir }/${ sha }-${ fileName }`;
}


export function fileExists(
	sha: string,
	fileName: string
): boolean {
	return fs.existsSync(
		getFilePath(sha, fileName)
	);
}


export function fileAtPathExists(
	path: string
): boolean {
	return fs.existsSync(path);
}


export function saveFile(
	sha: string,
	fileName: string,
	content: string
): Promise<string> {
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir);
		}

		const filePath: string = getFilePath(sha, fileName);

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


export async function checkAndMaybeDownload(
	sha: string,
	fileName: string,
	downloadCallback: () => any
): Promise<void> {
	if(fileExists(sha, fileName)) {
		return;
	}

	const downloadResult: any = await downloadCallback();
	const decodedResponse: string = decodeResponse(downloadResult.data.content);
	await saveFile(sha, fileName, decodedResponse);
}


export function getFileContent(
	sha: string,
	fileName: string
): string {
	return fs.readFileSync(
		getFilePath(sha, fileName),
		{
			encoding: 'utf8'
		}
	);
}

