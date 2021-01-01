import Bull from "bull";
import express from "express";

import * as auth from "../libs/auth";
import * as cpValidator from "../libs/cp-validator";

import Tree from "../models/tree";


const validateQueue: any = new Bull('validate-queue', process.env.REDIS_URL);
validateQueue.on('error', err => {
	console.log(err);
	throw err;
});


validateQueue.process(async (job) => {
	return new Promise(async (resolve, reject) => {
		const octokit: any = await auth.getClient(
			job.data.installationId,
			job.data.repositoryId
		);

		var commitMessage: string = '# CP Validator results\n\n';
		try {
			const tree: Tree = new Tree(
				octokit,
				job.data.owner,
				job.data.name,
				job.data.tree
			);
			await tree.init();

			for (const problemName of tree.getProblemNames()) {
				commitMessage += `## Problem ${ problemName }\n\n`;

				const runs: any = await cpValidator.testSolutions(
					tree.getSolutions(problemName),
					tree.getAllIo(problemName)
				);

				commitMessage += `### Solutions\n\n`;
				for (const solution in runs) {
					commitMessage += `**- ${ solution }**:\n`;
					for (var verdict in runs[solution]) {
						commitMessage += `${ verdict }: ${ runs[solution][verdict] }\n`;
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
			commit:         '04542a3cd962a399bcab071a93307a9cefe30e6e',
			tree:           'e12d8b2406ecf1bf40cda25ed5571b0c6ff16d12'
		});
	} catch(e) {
		console.log(e);
	}
}
//test2();

