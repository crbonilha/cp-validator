import { randomBytes } from "crypto";
import * as fs from "fs";

const tempDir = './temp';

export function getRandomName(
		length: number = 10) {
	return randomBytes(length).toString('hex');
}

export function getLanguage(
		fileName: string) {
	return fileName.substr(fileName.indexOf('.')+1);
}

export function decodeResponse(
		encodedMessage: string,
		base: BufferEncoding = 'base64') {
	return (new Buffer(encodedMessage, base).toString('ascii'));
}

export function getFileNameFromPath(
		path: string) {
	if(path.lastIndexOf('/') === -1) {
		return path;
	}
	else {
		return path.substr(path.lastIndexOf('/')+1);
	}
}

export function writeFile(
		content: string,
		nameSuffix: string = '',
		verbose: boolean = false) {
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir);
		}

		const fileName = getRandomName() + nameSuffix;
		const filePath = `${ tempDir }/${ fileName }`;

		if(verbose === true) {
			console.log(
				`Writing file ${ fileName } into ${ filePath }.`
			);
		}

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

export function deleteFile(
		filePath: string,
		verbose: boolean = false) {
	if(verbose === true) {
		console.log(
			`Deleting file ${ filePath }.`
		);
	}

	fs.unlinkSync(filePath);
}

module.exports = {
	getRandomName,
	getLanguage,
	decodeResponse,
	getFileNameFromPath,
	writeFile,
	deleteFile
};

