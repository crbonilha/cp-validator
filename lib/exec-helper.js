const childProcess = require('child_process');

function getCompileOutputPath(
		codePath) {
	return `${ codePath }.exe`;
}

/**
 * @param codePath the path of the file to be compiled.
 * @param language the name of the language to compile the code.
 * @returns Promise({ binPath })
 */
function compile(
		codePath,
		language,
		verbose = false) {
	return new Promise((resolve, reject) => {
		const binPath = getCompileOutputPath(codePath);

		var compileCmd = '';
		if(language === 'cpp') {
			compileCmd = `g++ ${ codePath } -o ${ binPath }`;
		}
		else {
			return reject(`Language ${ language } not supported.`);
		}

		if(verbose === true) {
			console.log(
				`Compiling ${ codePath } into ${ binPath }.`
			);
		}

		childProcess.exec(
			compileCmd,
			{
				timeout: 10000
			},
			(err, stdout, stderr) => {
				if(err) {
					console.log('Error when compiling code:');
					console.log(err);
					return reject(err);
				}
				resolve({
					binPath: `${ binPath }`
				});
			}
		);
	});
}

/**
 * @param binPath the path of the bin to be executed.
 * @param inputPath the path of the input to be sent to the binary.
 * @returns Promise({ output })
 */
async function run(
		binPath,
		inputPath,
		verbose = false) {
	return new Promise((resolve, reject) => {
		if(verbose === true) {
			console.log(
				`Running ${ binPath } with input ${ inputPath }.`
			);
		}

		try {
			childProcess.exec(
				`${ binPath } < ${ inputPath }`,
				{
					timeout: 1000
				},
				(err, stdout, stderr) => {
					if(err) {
						console.log('Error when running code:');
						console.log(err);
						if(err.signal === 'SIGTERM') {
							return resolve({
								output: '',
								killed: true,
								error:  'Time Limit Exceeded'
							});
						}
						else if(err.code === 139) {
							return resolve({
								output: '',
								killed: true,
								error:  'Segmentation Fault'
							});
						}
						else {
							return reject(err);
						}
					}
					resolve({
						output: stdout
					});
				}
			);
		} catch(e) {
			console.log('Almost uncaught error when running code:');
			console.log(e);
			return resolve({
				output: '',
				killed: true,
				error:  e
			});
		}
	});
}

module.exports = {
	getCompileOutputPath,
	compile,
	run
};

