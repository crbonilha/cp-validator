import Bull from "bull";
import Debug from "debug";
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


const debug = Debug('routes:github');


const validateQueue: any = new Bull('validate-queue', process.env.REDIS_URL);
validateQueue.on('error', err => {
	throw err;
});


function getAggregatedVerdictsAsTable(
	aggregatedVerdicts: AggregatedVerdict[]
): string {
	let message: string = '';

	if(aggregatedVerdicts.length === 0) {
		message += 'There are no solutions for this problem.\n';
		return message;
	}

	// header
	message += 'Solution | Verdict | AC | WA | TLE | SF | CE | OTHER | TOTAL\n';
	message += '-------- | ------- | -- | -- | --- | -- | -- | ----- | -----\n';

	// rows
	for(const av of aggregatedVerdicts) {
		let row: string = '';
		row += `**${ av.solutionName }** |`;

		let acCount:        number = av.accepted.count,
			waCount:    number = 0,
			tleCount:   number = 0,
			sfCount:    number = 0,
			ceCount:    number = 0,
			otherCount: number = 0;

		let verdict: string = '';
		if(av.compilationError) {
			verdict = verdict || 'CE';
			ceCount = av.compilationError.count;
		}
		if(av.wrongAnswer) {
			verdict = verdict || 'WA';
			waCount = av.wrongAnswer.count;
		}
		if(av.timeLimitExceeded) {
			verdict = verdict || 'TLE';
			tleCount = av.timeLimitExceeded.count;
		}
		if(av.segmentationFault) {
			verdict = verdict || 'SF';
			sfCount = av.segmentationFault.count;
		}
		if(av.aborted) {
			verdict = verdict || 'OTHER';
			otherCount = av.aborted.count;
		}
		verdict = verdict || 'AC';

		row += ` **${ verdict }** | ${ acCount } | ${ waCount } | ${ tleCount } |`;
		row += ` ${ sfCount } | ${ ceCount } | ${ otherCount } | ${ av.total }`;

		message += `${ row }\n`;
	}

	return message;
}


function getAggregatedValidatorVerdictsAsTable(
	aggregatedValidatorVerdicts: AggregatedValidatorVerdict[]
): string {
	let message: string = '';

	if(aggregatedValidatorVerdicts.length === 0) {
		message += 'There are no validators for this problem.\n';
		return message;
	}

	// header
	message += 'Validator / Folder';
	for(const folder of aggregatedValidatorVerdicts[0].folders) {
		message += ` | ${ folder.folder }`;
	}
	message += '\n';
	message += '------------------';
	for(const folder of aggregatedValidatorVerdicts[0].folders) {
		message += ` | --`;
	}
	message += '\n';

	// rows
	for(const avv of aggregatedValidatorVerdicts) {
		let row: string = `**${ avv.validatorName }**`;

		for(const folder of avv.folders) {
			if(folder.passed === folder.total) {
				row += ` | **OK**`;
			}
			else {
				row += ` | **NOT OK** (${ folder.passed }/${ folder.total })`;
			}
		}
		row += '\n';

		message += `${ row }\n`;
	}

	return message;
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
				commitMessage += getAggregatedVerdictsAsTable(aggregatedVerdicts);
				commitMessage += '\n';

				const aggregatedValidatorVerdicts: AggregatedValidatorVerdict[] =
					await validateInputs(
						tree.getValidators(problemName),
						tree.getAllIoFolders(problemName)
					);
				commitMessage += `### Validators\n\n`;
				commitMessage += getAggregatedValidatorVerdictsAsTable(
					aggregatedValidatorVerdicts);
				commitMessage += '\n';
			}
		} catch(e) {
			commitMessage = e;
		}
		resolve(commitMessage);
	});
});


validateQueue.on('completed', async (job, result) => {
	debug(`Job completed.`);

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
		debug(e);
	}
}
//test2();

