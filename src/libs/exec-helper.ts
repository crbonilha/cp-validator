import { exec, spawn } from "child_process";
import { createReadStream } from "fs";

import Cache from "./cache";


export interface RunResult {
	output: string;
	killed: boolean;
	code:   string;
	signal: string;
	error:  Error;
}


export function getCompileOutputPath(
	codePath: string
): string {
	return `${ codePath }.exe`;
}


export function compile(
	codePath: string,
	language: string,
	verbose:  boolean = false
): Promise<string> {
	return new Promise((resolve, reject) => {
		if(!Cache.fileAtPathExists(codePath)) {
			return reject(`File at ${ codePath } doesn\'t exist.`);
		}
		const binPath: string = getCompileOutputPath(codePath);

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
				resolve(`${ binPath }`);
			}
		);
	});
}


export async function run(
	binPath:   string,
	inputPath: string,
	verbose:   boolean = false
): Promise<RunResult> {
	return new Promise((resolve, reject) => {
		if(verbose === true) {
			console.log(
				`Running ${ binPath } with input ${ inputPath }.`
			);
		}

		if(!Cache.fileAtPathExists(binPath)) {
			return reject(`File at ${ binPath } doesn\'t exist.`);
		}
		if(!Cache.fileAtPathExists(inputPath)) {
			return reject(`File at ${ inputPath } doesn\'t exist.`);
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
						code:   null,
						signal: null,
						error:  new Error(`Code: ${ code }.`)
					});
				}

				if(signal) {
					console.log(`Exited with signal ${ signal }.`);
					return resolve({
						output: '',
						killed: true,
						code:   null,
						signal: signal,
						error:  new Error(`Signal: ${ signal }.`)
					});
				}

				return resolve({
					output: stdout,
					killed: false,
					code:   null,
					signal: null,
					error:  null
				});
			});

			ps.on('error', err => {
				console.log(`Error event:`);
				console.log(err);
				return resolve({
					output: '',
					killed: true,
					code:   null,
					signal: null,
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
				code:   null,
				signal: null,
				error:  e
			});
		}
	});
}

