import * as sequential from "promise-sequential";

import * as execHelper from "./exec-helper";

function aggregateResult(
		runs: any[]) {
	const aggregatedResult = {};
	for(var run of runs) {
		if(aggregatedResult[ run.solution ] === undefined) {
			aggregatedResult[ run.solution ] = {
				Total: 0
			};
		}
		aggregatedResult[ run.solution ].Total++;

		if(aggregatedResult[ run.solution ][ run.verdict ] === undefined) {
			aggregatedResult[ run.solution ][ run.verdict ] = 0;
		}
		aggregatedResult[ run.solution ][ run.verdict ]++;
	}
	return aggregatedResult;
}

function testSolution(
		solution: any,
		io: any) {
	return async () => {
		console.log(`Running solution ${ solution.name } on input ${ io.in.name }.`);
		const runResult = await solution.run(io.in);

		var verdict = 'Unknown';
		if(runResult.error) {
			if(runResult.signal === 'SIGTERM') {
				verdict = 'Time Limit Exceeded';
			}
			else if(runResult.signal === 'SIGSEGV') {
				verdict = 'Segmentation Fault';
			}
			else if(runResult.signal === 'SIGABRT') {
				verdict = 'Aborted';
			}
			else {
				verdict = runResult.error;
			}
		}
		else {
			if(runResult.output === io.out.getFileContent()) {
				verdict = 'Accepted';
			}
			else {
				verdict = 'Wrong Answer';
			}
		}

		return {
			solution: solution.name,
			verdict:  verdict
		};
	};
}

export async function testSolutions(
		solutions: any[],
		ios: any[]) {
	const runPromises = [];

	for (const solution of solutions) {
		try {
			await solution.compile();
		} catch(e) {
			runPromises.push(
				() => {
					return {
						solution: solution.name,
						error:    e
					};
				}
			);
			continue;
		}

		for (const io of ios) {
			runPromises.push(
				testSolution(
					solution,
					io
				)
			);
		}
	}

	return new Promise((resolve, reject) => {
		sequential(runPromises)
		.then(runs => {
			return resolve(aggregateResult(runs));
		})
		.catch(err => {
			return reject(err);
		});
	});
}

