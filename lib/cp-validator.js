const sequential = require('promise-sequential');

const execHelper = require('./exec-helper');

function aggregateResult(
		runs) {
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
		solution,
		io) {
	return async () => {
		console.log(`Running solution ${ solution.name } on input ${ io.in.name }.`);
		const runResult = await solution.run(io.in);

		var verdict = 'Unknown';
		if(runResult.error) {
			verdict = runResult.error;
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

async function testSolutions(
		solutions,
		ios) {
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

module.exports = {
	testSolutions: testSolutions
};

