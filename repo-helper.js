
function decodeResponse(
		encoded) {
	const buff = new Buffer(encoded, 'base64');
	return buff.toString('ascii');
}

async function getFileContent(
		octokit,
		owner,
		repo,
		path) {
	const result = await octokit.repos.getContent({
		owner: owner,
		repo:  repo,
		path:  path
	});

	return decodeResponse(result.data.content);
}

async function getSolutions(
		octokit,
		owner,
		repo,
		problem) {
	const files = await octokit.repos.getContent({
		owner: owner,
		repo: repo,
		path: `problems/${ problem }/solutions`
	});

	const solutions = [];
	for (var file of files.data) {
		solutions.push({
			name:    file.name,
			content: await getFileContent(
				octokit,
				owner,
				repo,
				`problems/${ problem }/solutions/${ file.name }`
			)
		});
	}

	return solutions;
}

async function getIoFolderContent(
		octokit,
		owner,
		repo,
		path) {
	const files = await octokit.repos.getContent({
		owner: owner,
		repo:  repo,
		path:  path
	});

	const ios = [];
	for (var ioFile of files.data) {
		if(ioFile.name.indexOf('.in') !== -1) {
			const outputFileName = ioFile.name.substr(0, ioFile.name.indexOf('.in')) + '.out';

			ios.push({
				input: {
					name:    ioFile.name,
					content: await getFileContent(
						octokit,
						owner,
						repo,
						`${ path }/${ ioFile.name }`
					)
				},
				output: {
					name:    outputFileName,
					content: await getFileContent(
						octokit,
						owner,
						repo,
						`${ path }/${ outputFileName }`
					)
				}
			});
		}
	}

	return ios;
}

async function getIos(
		octokit,
		owner,
		repo,
		problem) {
	const files = await octokit.repos.getContent({
		owner: owner,
		repo: repo,
		path: `problems/${ problem }/io`
	});

	var ios = [];
	for (var ioFolder of files.data) {
		if(ioFolder.type === 'file') {
		}
		else if(ioFolder.type === 'dir') {
			ios = ios.concat(
				await getIoFolderContent(
					octokit,
					owner,
					repo,
					`problems/${ problem }/io/${ ioFolder.name }`
				)
			);
		}
	}

	return ios;
}

module.exports = {
	getSolutions: getSolutions,
	getIos:       getIos
};

