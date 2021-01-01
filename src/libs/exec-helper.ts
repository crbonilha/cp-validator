import { exec, spawn } from "child_process";
import { createReadStream } from "fs";


export function getCompileOutputPath(
	codePath: string
): string {
	return `${ codePath }.exe`;
}


export function compile(
	codePath: string,
	language: string,
	verbose: boolean = false
): Promise<any> {
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

		exec(
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


export async function run(
	binPath: string,
	inputPath: string,
	verbose: boolean = false
): Promise<any> {
	return new Promise((resolve, reject) => {
		if(verbose === true) {
			console.log(
				`Running ${ binPath } with input ${ inputPath }.`
			);
		}

		try {
			const ps = spawn(binPath);

			var stdout = '';
			ps.stdout.on('data', data => {
				stdout += data;
			});

			ps.stdin.on('error', (err: any) => {
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

			createReadStream(inputPath).pipe(ps.stdin);

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

