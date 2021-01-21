import { ChildProcess, exec, spawn } from "child_process";
import Debug from "debug";
import { createReadStream } from "fs";

import Cache from "./cache";

const debug = Debug('libs:execHelper');


export interface RunResult {
	output: string;
	killed: boolean;
	code:   number;
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
	language: string
): Promise<string> {
	return new Promise((resolve, reject) => {
		if(!Cache.fileAtPathExists(codePath)) {
			return reject(`File at ${ codePath } doesn\'t exist.`);
		}
		const binPath: string = getCompileOutputPath(codePath);

		var compileCmd: string = '';
		if(language === 'cpp') {
			compileCmd = `g++ ${ codePath } -o ${ binPath }`;
		}
		else {
			return reject(`Language ${ language } not supported.`);
		}

		debug(`Compiling ${ codePath } into ${ binPath }.`);
		exec(
			compileCmd,
			{
				timeout: 10000
			},
			(err: Error, stdout: string, stderr: string) => {
				if(err) {
					return reject(err);
				}
				resolve(`${ binPath }`);
			}
		);
	});
}


export async function run(
	binPath:   string,
	inputPath: string
): Promise<RunResult> {
	return new Promise((resolve, reject) => {
		if(!Cache.fileAtPathExists(binPath)) {
			return reject(`File at ${ binPath } doesn\'t exist.`);
		}
		if(!Cache.fileAtPathExists(inputPath)) {
			return reject(`File at ${ inputPath } doesn\'t exist.`);
		}

		debug(`Running ${ binPath } with input ${ inputPath }.`);
		try {
			const ps: ChildProcess = spawn(binPath);

			var concatenatedOutput: string = '';
			ps.stdout.on('data', (data: string) => {
				concatenatedOutput += data;
			});

			ps.on('exit', (code: number, signal: string) => {
				if(code) {
					debug(`Exited with code ${ code }.`);
					return resolve({
						output: '',
						killed: false,
						code:   code,
						signal: null,
						error:  new Error(`Code: ${ code }.`)
					});
				}

				if(signal) {
					debug(`Exited with signal ${ signal }.`);
					return resolve({
						output: '',
						killed: true,
						code:   null,
						signal: signal,
						error:  new Error(`Signal: ${ signal }.`)
					});
				}

				debug(`All good.`);
				return resolve({
					output: concatenatedOutput,
					killed: false,
					code:   null,
					signal: null,
					error:  null
				});
			});

			ps.on('error', (err: Error) => {
				throw err;
			});

			ps.stdin.on('error', (err: Error) => {
				debug(err);
			});

			createReadStream(inputPath).pipe(ps.stdin);

			setTimeout(() => {
				ps.kill();
			}, 1000);
		} catch(err: any) {
			debug(err);
			resolve({
				output: '',
				killed: true,
				code:   null,
				signal: null,
				error:  err
			});
		}
	});
}

