const crypto = require('crypto');
const fs     = require('fs');

function getRandomName(
		length = 10) {
	return crypto.randomBytes(length).toString('hex');
}

function getLanguage(
		fileName) {
	return fileName.substr(fileName.indexOf('.')+1);
}

function writeFile(
		content,
		nameSuffix = '',
		verbose = false) {
	return new Promise((resolve, reject) => {
		const fileName = getRandomName() + nameSuffix;
		const filePath = `./temp/${ fileName }`;

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

module.exports = {
	getRandomName,
	getLanguage,
	writeFile
};

