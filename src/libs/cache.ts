import * as fs from "fs";

import * as util from "./util";

const tempDir = './temp';

export function getFilePath(
		sha: string,
		fileName: string) {
	return `${ tempDir }/${ sha }-${ fileName }`;
}

export function fileExists(
		sha: string,
		fileName: string) {
	return fs.existsSync(
		getFilePath(sha, fileName)
	);
}

export function fileAtPathExists(
		path: string) {
	return fs.existsSync(path);
}

export function saveFile(
		sha: string,
		fileName: string,
		content: string) {
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir);
		}

		const filePath = getFilePath(sha, fileName);

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
		downloadCallback: () => any) {
	if(fileExists(sha, fileName)) {
		return;
	}

	const downloadResult = await downloadCallback();
	const decodedResponse = util.decodeResponse(downloadResult.data.content);
	await saveFile(sha, fileName, decodedResponse);
}

export function getFileContent(
		sha: string,
		fileName: string) {
	return fs.readFileSync(
		getFilePath(sha, fileName),
		{
			encoding: 'utf8'
		}
	);
}

