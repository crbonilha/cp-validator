const childProcess = require('child_process');
const fs           = require('fs');

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
			const ps = childProcess.spawn(binPath);

			var stdout = '';
			ps.stdout.on('data', data => {
				stdout += data;
			});

			ps.stdin.on('error', err => {
				if(err.code === 'EPIPE') {
					// time limit exceeded.
				}
				else {
					console.log(`Error on stdin stream.`);
					console.log(err);
				}
			});

			ps.on('exit', (code, signal) => {
				if(code) {
					console.log(`Exited with code ${ code }.`);
					return resolve({
						output: '',
						killed: false,
						error:  `Code: ${ code }.`
					});
				}

				if(signal) {
					console.log(`Exited with signal ${ signal }.`);
					return resolve({
						output: '',
						killed: true,
						error:  `Signal: ${ signal }.`,
						signal: signal
					});
				}

				return resolve({
					output: stdout,
					killed: false,
					error:  ''
				});
			});

			ps.on('error', err => {
				console.log(`Error event:`);
				console.log(err);
				return resolve({
					output: '',
					killed: true,
					error:  err
				});
			});

			fs.createReadStream(inputPath).pipe(ps.stdin);

			setTimeout(() => {
				ps.kill();
			}, 1000);
		} catch(e) {
			console.log(`Exception:`);
			console.log(e);
			resolve({
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

