const crypto = require('crypto');
const fs     = require('fs');

const tempDir = './temp';

function getRandomName(
		length = 10) {
	return crypto.randomBytes(length).toString('hex');
}

function getLanguage(
		fileName) {
	return fileName.substr(fileName.indexOf('.')+1);
}

function decodeResponse(
		encodedMessage,
		base = 'base64') {
	return (new Buffer(encodedMessage, base).toString('ascii'));
}

function getFileNameFromPath(
		path) {
	if(path.lastIndexOf('/') === -1) {
		return path;
	}
	else {
		return path.substr(path.lastIndexOf('/')+1);
	}
}

function writeFile(
		content,
		nameSuffix = '',
		verbose = false) {
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

function deleteFile(
		filePath,
		verbose = false) {
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

