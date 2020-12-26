const fs = require('fs');

const tempDir = './temp';

function fileExists(
		sha,
		fileName) {
	return fs.existsSync(sha + '-' + fileName);
}

function saveFile(
		sha,
		fileName,
		content) {
	return new Promise((resolve, reject) => {
		if(!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir);
		}

		const filePath = `${ tempDir }/${ sha }-${ fileName }`;

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

module.exports = {
	fileExists,
	saveFile
};

