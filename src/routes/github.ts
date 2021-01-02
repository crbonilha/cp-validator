import Bull from "bull";
import express from "express";

import * as auth from "../libs/auth";
import {
	testSolutions,
	validateInputs,
	AggregatedVerdict,
	AggregatedValidatorVerdict,
	VerdictCount
} from "../libs/cp-validator";

import Tree from "../models/tree";


const validateQueue: any = new Bull('validate-queue', process.env.REDIS_URL);
validateQueue.on('error', err => {
	console.log(err);
	throw err;
});


function maybeAddVerdictToMessage(
	verdict:          VerdictCount,
	verdictShortName: string,
	total:            number
): string {
	let verdictMessage = '';
	if(verdict && verdict.count > 0) {
		verdictMessage += `${ verdictShortName }: ${ verdict.count } / ${ total }\n`;
		if(verdict.testCaseNames.length > 0) {
			verdictMessage += `-- [ ${ verdict.testCaseNames.join(', ') } ]\n`;
		}
	}
	return verdictMessage;
}


validateQueue.process(async (job) => {
	return new Promise(async (resolve, reject) => {
		const octokit: any = await auth.getClient(
			job.data.installationId,
			job.data.repositoryId
		);

		let commitMessage: string = '# CP Validator results\n\n';
		try {
			const tree: Tree = new Tree(
				octokit,
				job.data.owner,
				job.data.name,
				job.data.tree
			);
			await tree.init();

			for(const problemName of tree.getProblemNames()) {
				commitMessage += `## Problem ${ problemName }\n\n`;

				const aggregatedVerdicts: AggregatedVerdict[] = await testSolutions(
					tree.getSolutions(problemName),
					tree.getAllIo(problemName)
				);

				commitMessage += `### Solutions\n\n`;
				for(const av of aggregatedVerdicts) {
					commitMessage += `**- ${ av.solutionName }: `;

					const verdict = [];
					if(av.accepted.count == av.total) {
						verdict.push('AC');
					}
					else {
						if(av.wrongAnswer) {
							verdict.push('WA');
						}
						if(av.timeLimitExceeded) {
							verdict.push('TLE');
						}
						if(av.segmentationFault) {
							verdict.push('SF');
						}
						if(av.compilationError) {
							verdict.push('CE');
						}
						if(av.aborted) {
							verdict.push('OTHER');
						}
					}
					commitMessage += `${ verdict.join(',') }**\n`;

					commitMessage += `AC: ${ av.accepted.count } / ${ av.total }\n`;
					commitMessage += maybeAddVerdictToMessage(
						av.wrongAnswer, 'WA', av.total);
					commitMessage += maybeAddVerdictToMessage(
						av.timeLimitExceeded, 'TLE', av.total);
					commitMessage += maybeAddVerdictToMessage(
						av.segmentationFault, 'SF', av.total);
					commitMessage += maybeAddVerdictToMessage(
						av.compilationError, 'CE', av.total);
					commitMessage += maybeAddVerdictToMessage(
						av.aborted, 'OTHER', av.total);

					commitMessage += `\n`;
				}


				const aggregatedValidatorVerdicts: AggregatedValidatorVerdict[] =
					await validateInputs(
						tree.getValidators(problemName),
						tree.getAllIo(problemName)
					);

				commitMessage += `### Validators\n\n`;
				for(const avv of aggregatedValidatorVerdicts) {
					commitMessage += `**- ${ avv.validatorName }: `;

					if(avv.passed === avv.total) {
						commitMessage += `Passed (${ avv.passed })\n`;
					}
					else {
						commitMessage += `Not passed ${ avv.passed } / ${ avv.total }\n`;
						commitMessage +=
							`-- [ ${ avv.failedTestCaseNames.join(', ') } ]\n`;
					}

					commitMessage += `\n`;
				}
			}
		} catch(e) {
			commitMessage = e;
		}
		resolve(commitMessage);
	});
});


validateQueue.on('completed', async (job, result) => {
	console.log('job completed');
	const octokit: any = await auth.getClient(
		job.data.installationId,
		job.data.repositoryId
	);

	await octokit.repos.createCommitComment({
		owner:      job.data.owner,
		repo:       job.data.name,
		commit_sha: job.data.commit,
		body:       result
	});
});


export async function pushEvent(
	req: express.Request,
	res: express.Response
): Promise<void> {
	var octokit: any;

	try {
		octokit = await auth.getClient(
			req.body.installation.id,
			req.body.repository.id
		);
	} catch(e) {
		return Promise.reject(
			res.sendStatus(500)
		);
	}
	res.sendStatus(200);

	octokit.repos.createCommitComment({
		owner:      req.body.repository.owner.name,
		repo:       req.body.repository.name,
		commit_sha: req.body.head_commit.id,
		body:       `Running the CP Validator...`
	});

	validateQueue.add({
		installationId: req.body.installation.id,
		repositoryId:   req.body.repository.id,
		owner:          req.body.repository.owner.name,
		name:           req.body.repository.name,
		commit:         req.body.head_commit.id,
		tree:           req.body.head_commit.tree_id
	});
}


async function test2() {
	try {
		validateQueue.add({
			installationId: 13698200,
			repositoryId:   287727371,
			owner:          'crbonilha',
			name:           'sample-contest',
			commit:         'ccbda63204bf71d866273ffaab075723f083fa8f',
			tree:           '171beceef6d236c8a2da665ccfb375aa17360faf'
		});
	} catch(e) {
		console.log(e);
	}
}
//test2();

