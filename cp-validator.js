const sequential = require('promise-sequential');

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
		console.log(`Running solution ${ solution.name } on input ${ io.input.name }.`);
		const runResult = await solution.run(io.input);

		var verdict = 'Unknown';
		if(runResult.killed === true) {
			verdict = 'Time Limit Exceeded';
		}
		else {
			if(runResult.output === io.output.content) {
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
		await solution.compile();

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

