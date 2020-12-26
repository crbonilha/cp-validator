const fs = require('fs');

const util = require('./util');

const tempDir = './temp';

function getFilePath(
		sha,
		fileName) {
	return `${ tempDir }/${ sha }-${ fileName }`;
}

function fileExists(
		sha,
		fileName) {
	return fs.existsSync(
		getFilePath(sha, fileName)
	);
}

function fileAtPathExists(
		path) {
	return fs.existsSync(path);
}

function saveFile(
		sha,
		fileName,
		content) {
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

async function checkAndMaybeDownload(
		sha,
		fileName,
		downloadCallback) {
	if(fileExists(sha, fileName)) {
		return;
	}

	const downloadResult = await downloadCallback();
	const decodedResponse = util.decodeResponse(downloadResult.data.content);
	await saveFile(sha, fileName, decodedResponse);
}

module.exports = {
	getFilePath,
	fileExists,
	fileAtPathExists,
	saveFile,
	checkAndMaybeDownload
};

