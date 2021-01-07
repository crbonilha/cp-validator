import Debug from "debug";
import sequential from "promise-sequential";

import { IoInterface } from "../models/tree";
import Solution from "../models/solution";
import TestCase from "../models/test-case";
import Validator from "../models/validator";
import { RunResult} from "../libs/exec-helper";


const debug = Debug('libs:cp-validator');


enum Verdict {
	accepted = 'accepted',
		wrongAnswer = 'wrongAnswer',
		timeLimitExceeded = 'timeLimitExceeded',
		segmentationFault = 'segmentationFault',
		compilationError = 'compilationError',
		aborted = 'aborted',
		other = 'other',
}

interface SolutionRun {
	solutionName: string;
	verdict:      Verdict;
	testCaseName: string;
}

interface ValidatorRun {
	validatorName: string;
	testCaseName:  string;
	passed:        boolean;
}

export interface VerdictCount {
	count:         number;
	testCaseNames: string[];
}

export interface AggregatedVerdict {
	solutionName:       string;
	total:              number;
	accepted:           VerdictCount;
	wrongAnswer?:       VerdictCount;
	timeLimitExceeded?: VerdictCount;
	segmentationFault?: VerdictCount;
	compilationError?:  VerdictCount;
	aborted?:           VerdictCount;
}

export interface AggregatedValidatorVerdict {
	validatorName:       string;
	total:               number;
	passed:              number;
	failedTestCaseNames: string[];
}


function incrementVerdictCount(
	aggregatedVerdict: AggregatedVerdict,
	verdict:           Verdict,
	testCaseName?:     string
): VerdictCount {
	if(aggregatedVerdict[ verdict ] === undefined) {
		aggregatedVerdict[ verdict ] = {
			count:         0,
			testCaseNames: []
		}
	}

	aggregatedVerdict[ verdict ].count++;

	if(testCaseName !== undefined) {
		aggregatedVerdict[ verdict ].testCaseNames.push(testCaseName);
	}

	return aggregatedVerdict[ verdict ];
}


function aggregateResult(
	runs: SolutionRun[]
): AggregatedVerdict[] {
	debug(`Aggregating solutions verdicts.`);
	const aggregatedVerdicts: AggregatedVerdict[] = [];
	for(const run of runs) {
		if(!aggregatedVerdicts.some(av => av.solutionName === run.solutionName)) {
			aggregatedVerdicts.push({
				solutionName: run.solutionName,
				total:        0,
				accepted: {
					count:         0,
					testCaseNames: []
				}
			});
		}
		const aggregatedVerdict: AggregatedVerdict =
			aggregatedVerdicts.find(av => av.solutionName === run.solutionName);

		aggregatedVerdict.total++;
		if(run.verdict === Verdict.accepted) {
			aggregatedVerdict.accepted = incrementVerdictCount(
				aggregatedVerdict,
				Verdict.accepted
			);
		}
		else {
			aggregatedVerdict[ run.verdict ] = incrementVerdictCount(
				aggregatedVerdict,
				run.verdict,
				run.testCaseName
			);
		}
	}
	return aggregatedVerdicts;
}


function testSolution(
	solution: Solution,
	io:       IoInterface
): () => Promise<SolutionRun> {
	return async () => {
		debug(`Running solution ${ solution.name } on input ${ io.in.name }.`);
		const runResult: any = await solution.run(io.in);

		var verdict: Verdict = Verdict.other;
		if(runResult.error) {
			if(runResult.signal === 'SIGTERM') {
				verdict = Verdict.timeLimitExceeded;
			}
			else if(runResult.signal === 'SIGSEGV') {
				verdict = Verdict.segmentationFault;
			}
			else if(runResult.signal === 'SIGABRT') {
				verdict = Verdict.aborted;
			}
		}
		else {
			if(runResult.output === io.out.getFileContent()) {
				verdict = Verdict.accepted;
			}
			else {
				verdict = Verdict.wrongAnswer;
			}
		}

		return {
			solutionName: solution.name,
			verdict:      verdict,
			testCaseName: io.in.name
		};
	};
}


function validateInput(
	validator: Validator,
	input:     TestCase
): () => Promise<ValidatorRun> {
	return async () => {
		debug(`Running validator ${ validator.name } on input ${ input.name }.`);
		const runResult: RunResult = await validator.run(input);

		let passed: boolean = true;
		if(runResult.killed || runResult.code || runResult.signal) {
			passed = false;
		}

		return {
			validatorName: validator.name,
			testCaseName:  input.name,
			passed:        passed
		};
	};
}


export async function testSolutions(
	solutions: Solution[],
	ios:       IoInterface[]
): Promise<AggregatedVerdict[]> {
	const runPromises: (() => Promise<SolutionRun>)[] = [];

	for(const solution of solutions) {
		try {
			await solution.compile();
		} catch(e) {
			runPromises.push(
				() => {
					debug(`Failed to compile ${ solution.name }.`);
					return Promise.resolve({
						solutionName: solution.name,
						verdict:      Verdict.compilationError,
						testCaseName: undefined
					});
				}
			);
			continue;
		}

		for(const io of ios) {
			runPromises.push(
				testSolution(
					solution,
					io
				)
			);
		}
	}

	return sequential(runPromises)
	.then(aggregateResult);
}


export async function validateInputs(
	validators: Validator[],
	ios:        IoInterface[]
): Promise<AggregatedValidatorVerdict[]> {
	const runPromises: (() => Promise<ValidatorRun>)[] = [];

	for(const validator of validators) {
		try {
			await validator.compile();
		} catch(e) {
			runPromises.push(
				() => {
					debug(`Failed to compile ${ validator.name }.`);
					return Promise.resolve({
						validatorName: validator.name,
						testCaseName:  '',
						passed:        false
					});
				}
			);
			continue;
		}

		for(const io of ios) {
			runPromises.push(
				validateInput(
					validator,
					io.in
				)
			);
		}
	}

	return sequential(runPromises)
	.then((validatorRuns: ValidatorRun[]) => {
		debug(`Aggregating validators verdicts.`);
		const avvList: AggregatedValidatorVerdict[] = [];
		for(const vr of validatorRuns) {
			if(!avvList.some(avv => avv.validatorName === vr.validatorName)) {
				avvList.push({
					validatorName:       vr.validatorName,
					total:               0,
					passed:              0,
					failedTestCaseNames: []
				});
			}
			const avv = avvList.find(avv => avv.validatorName === vr.validatorName);

			avv.total++;
			if(vr.passed) {
				avv.passed++;
			}
			else {
				avv.failedTestCaseNames.push(vr.testCaseName);
			}
		}
		return avvList;
	});
}

