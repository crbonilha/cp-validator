import sequential from "promise-sequential";

import { IoInterface } from "../models/tree";
import Solution from "../models/solution";


enum Verdict {
	accepted,
		wrongAnswer,
		timeLimitExceeded,
		segmentationFault,
		compilationError,
		aborted,
		other,
}

interface SolutionRun {
	solutionName: string;
	verdict:      Verdict;
	testCaseName: string;
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
		console.log(`Running solution ${ solution.name } on input ${ io.in.name }.`);
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


export async function testSolutions(
	solutions: Solution[],
	ios:       IoInterface[]
): Promise<AggregatedVerdict[]> {
	const runPromises: (() => Promise<SolutionRun>)[] = [];

	for (const solution of solutions) {
		try {
			await solution.compile();
		} catch(e) {
			runPromises.push(
				() => {
					return Promise.resolve({
						solutionName: solution.name,
						verdict:      Verdict.compilationError,
						testCaseName: ''
					});
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

	return sequential(runPromises)
	.then(runs => {
		return aggregateResult(runs);
	});
}

