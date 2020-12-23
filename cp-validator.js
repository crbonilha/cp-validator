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
				resolve(result);
			}
		);
	});
}

function checkSolutionResult(
		result,
		expectedOutput) {
	return new Promise((resolve, reject) => {
		result.verdict = 'Unknown';

		if(typeof result.errorType === 'string') {
			if(result.errorType === 'compile-time') {
				result.verdict = 'Compilation Error';
			}
			else if(result.errorType === 'run-time') {
				result.verdict = 'Runtime Error';
			}
			else if(result.errorType === 'run-timeout') {
				result.verdict = 'Time Limit Exceeded';
			}
			else {
				result.verdict = result.errorType;
			}
		}
		else {
			if(result.stdout === expectedOutput) {
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
		.then(res => {
			return resolve(res);
		})
		.catch(err => {
			return reject(err);
		});
	});
}

module.exports = {
	testSolutions: testSolutions
};

