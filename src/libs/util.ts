import { randomBytes } from "crypto";
import * as fs from "fs";


const tempDir: string = './temp';


export function getLanguage(
	fileName: string
): string {
	return fileName.substr(fileName.indexOf('.')+1);
}


export function decodeResponse(
	encodedMessage: string,
	base: BufferEncoding = 'base64'
): string {
	return (new Buffer(encodedMessage, base).toString('ascii'));
}


export function getFileNameFromPath(
	path: string
): string {
	if(path.lastIndexOf('/') === -1) {
		return path;
	}
	else {
		return path.substr(path.lastIndexOf('/')+1);
	}
}


export function deleteFile(
	filePath: string,
	verbose: boolean = false
): void {
	if(verbose === true) {
		console.log(
			`Deleting file ${ filePath }.`
		);
	}

	fs.unlinkSync(filePath);
}

