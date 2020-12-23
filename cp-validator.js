const { cpp }    = require('compile-run');
const sequential = require('promise-sequential');

function runSolution(
		solution,
		input) {
	return new Promise((resolve, reject) => {
		console.log(`Running solution ${ solution.name } on input ${ input.name }.`);

		cpp.runSource(
			solution.content,
			{
				stdin: input.content
			},
			(err, result) => {
				if(err) {
					return reject(err);
				}
				resolve({
					solution: solution.name,
					input:    input.name,
					verdict:  'Unknown',
					raw:      result
				});
			}
		);
	});
}

function checkSolutionResult(
		result,
		expectedOutput) {
	return new Promise((resolve, reject) => {
		result.verdict = 'Unknown';

		if(typeof result.raw.errorType === 'string') {
			if(result.raw.errorType === 'compile-time') {
				result.verdict = 'Compilation Error';
			}
			else if(result.raw.errorType === 'run-time') {
				result.verdict = 'Runtime Error';
			}
			else if(result.raw.errorType === 'run-timeout') {
				result.verdict = 'Time Limit Exceeded';
			}
			else {
				result.verdict = result.raw.errorType;
			}
		}
		else {
			if(result.raw.stdout === expectedOutput) {
				result.verdict = 'Accepted';
			}
			else {
				result.verdict = 'Wrong Answer';
			}
		}

		resolve(result);
	});
}

function testSolution(
		solution,
		io) {
	return () => {
		return runSolution(
			solution,
			io.input
		)
		.then(result => {
			return checkSolutionResult(
				result,
				io.output.content
			);
		});
	};
}

function testSolutions(
		solutions,
		ios) {
	const runPromises = [];

	for (var solution of solutions) {
		for (var io of ios) {
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

			return resolve(aggregatedResult);
		})
		.catch(err => {
			return reject(err);
		});
	});
}

module.exports = {
	testSolutions: testSolutions
};

