const clone  = require('git-clone');
const crypto = require('crypto');

const defaultPath = './git-repos/';

function cloneRepo(
		repo) {
	return new Promise((resolve, reject) => {
		const targetFolder = crypto.randomBytes(10).toString('hex');
		const targetPath = defaultPath + targetFolder;

		console.log('Cloning git repo ' + repo + ' at ' + targetPath);

		clone(repo, targetPath, (res, err) => {
			if(err) {
				return reject(err);
			}
			resolve(targetPath);
		});
	});
}

module.exports = {
	cloneRepo: cloneRepo
};

