import Debug from "debug";
import sequential from "promise-sequential";

import { IoInterface, IoFolderInterface } from "../models/tree";
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
	folderNumber:  number;
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

export interface AggregatedFolderValidatorVerdict {
	folder: number;
	total:  number;
	passed: number;
}

export interface AggregatedValidatorVerdict {
	validatorName: string;
	folders:       AggregatedFolderValidatorVerdict[];
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
	validator:    Validator,
	folderNumber: number,
	input:        TestCase
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
			folderNumber:  folderNumber,
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
	ioFolders:  IoFolderInterface[]
): Promise<AggregatedValidatorVerdict[]> {
	const runPromises: (() => Promise<ValidatorRun>)[] = [];

	for(const validator of validators) {
		try {
			await validator.compile();
		} catch(e) {
			runPromises.push(
				(): Promise<ValidatorRun> => {
					debug(`Failed to compile ${ validator.name }.`);
					return Promise.resolve({
						validatorName: validator.name,
						folderNumber:  0,
						testCaseName:  '',
						passed:        false
					});
				}
			);
			continue;
		}

		for(const ioFolder of ioFolders) {
			for(const io of ioFolder.ios) {
				runPromises.push(
					validateInput(
						validator,
						ioFolder.folder,
						io.in
					)
				);
			}
		}
	}

	return sequential(runPromises)
	.then((validatorRuns: ValidatorRun[]) => {
		debug(`Aggregating validators verdicts.`);
		const avvList: AggregatedValidatorVerdict[] = [];
		for(const vr of validatorRuns) {
			if(!avvList.some(avv => avv.validatorName === vr.validatorName)) {
				avvList.push({
					validatorName: vr.validatorName,
					folders:       []
				});
			}
			const avv = avvList.find(avv => avv.validatorName === vr.validatorName);

			if(!avv.folders.some(folder => folder.folder === vr.folderNumber)) {
				avv.folders.push({
					folder: vr.folderNumber,
					passed: 0,
					total:  0
				});
			}
			const folder: AggregatedFolderValidatorVerdict = avv.folders.find(
				folder => folder.folder === vr.folderNumber);

			folder.total++;
			if(vr.passed) {
				folder.passed++;
			}
		}
		return avvList;
	});
}

