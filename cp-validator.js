const { cpp }    = require('compile-run');
const fs         = require('fs');
const ls         = require('ls');
const sequential = require('promise-sequential');

function runSolution(
		solutionPath,
		inputFilePath,
		outputFilePath) {
	return () => {
		return new Promise((resolve, reject) => {
			const inputString = fs.readFileSync(inputFilePath, { encoding: 'utf8' });
			const outputString = fs.readFileSync(outputFilePath, { encoding: 'utf8' });

			console.log('about to run ' + solutionPath + ' on input "' + inputString + '"');

			cpp.runFile(
				solutionPath,
				{
					stdin: inputString
				},
				(err, result) => {
					if(err) {
						return reject(err);
					}

					result.verdict = 'Unknown';

					if(typeof result.errorType === 'string') {
						if(result.errorType === 'compile-time') {
							result.verdict = 'Compilation error';
						}
						else if(result.errorType === 'run-time') {
							result.verdict = 'Runtime error';
						}
						else if(result.errorType === 'run-timeout') {
							result.verdict = 'Time limit exceeded';
						}
						else {
							result.verdict = result.errorType;
						}
					}
					else {
						if(result.stdout === outputString) {
							result.verdict = 'Accepted';
						}
						else {
							result.verdict = 'Wrong answer';
						}
					}

					return resolve(result);
				}
			);
		});
	};
}

function testSolutions(
		contestPath,
		problemsFilter,
		solutionsFilter,
		ioFilter) {
	const runPromises = [];

	const problemsList = ls(
		contestPath + 'problems/*',
		{ type: 'dir' },
		problemsFilter || /./
	);
	for (var problem of problemsList) {
		console.log('Problem ' + problem.name);

		const solutionsList = ls(
			problem.full + '/solutions/*',
			{ type: 'file' },
			solutionsFilter || /./
		);

		const rawIoList = ls(
			problem.full + '/io/*/*.in',
			{ type: 'file' },
			ioFilter || /./
		);
		const ioList = [];
		for (var io of rawIoList) {
			const inputFile = io.full;
			const outputFile = io.path + '/' + io.name + '.out';

			const outputLs = ls(
				outputFile,
				{ type: 'file' }
			);
			if(outputLs.length == 1) {
				ioList.push({
					input: io,
					output: outputLs[0]
				});
			}
		}

		for (var solution of solutionsList) {
			console.log('Solution ' + solution.name);

			for (var io of ioList) {
				console.log('Test ' + io.input.name);

				runPromises.push(
					runSolution(
						solution.full,
						io.input.full,
						io.output.full
					)
				);
			}
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

