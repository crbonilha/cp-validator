
var Bull;
try {
	Bull = require('bull');
} catch(e) {
	console.log(e);
}

const auth        = require('../libs/auth');
const cpValidator = require('../libs/cp-validator');

const Tree = require('../models/tree');

var validateQueue;
try {
	validateQueue = new Bull('validate-queue');
validateQueue.process(async (job) => {
	return new Promise(async (resolve, reject) => {
		const octokit = await auth.getClient(
			job.data.installationId,
			job.data.repositoryId
		);

		var commitMessage = '# CP Validator results\n\n';
		try {
			const tree = new Tree(
				octokit,
				job.data.owner,
				job.data.name,
				job.data.tree
			);
			await tree.init();

			for (const problem of tree.trimmedTree.problems) {
				commitMessage += `## Problem ${ problem.name }\n\n`;

				const runs = await cpValidator.testSolutions(
					tree.getSolutions(problem.name),
					tree.getAllIo(problem.name)
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

		const result = await octokit.repos.createCommitComment({
			owner:      job.data.owner,
			repo:       job.data.name,
			commit_sha: job.data.commit,
			body:       commitMessage
		});
	});
});
} catch(e) {
	console.log('failed to connect to bull');
	console.log(e);
}

async function pushEvent(
		req,
		res) {
	var octokit;
	try {
		octokit = await auth.getClient(
			req.body.installation.id,
			req.body.repository.id
		);
	} catch(e) {
		return res.sendStatus(500);
	}
	res.sendStatus(200);

	octokit.repos.createCommitComment({
		owner:      req.body.repository.owner.name,
		repo:       req.body.repository.name,
		commit_sha: req.body.head_commit.id,
		body:       `Running the CP Validator...`
	});

	const validateJob = await validateQueue.add({
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
		const octokit = await auth.getClient(13698200, ['287727371']);

		const tree = new Tree(
			octokit,
			'crbonilha',
			'liga-etapa4',
			'a020a8f7bbbfb09be5ff83cac8c3eac5f183371b'
		);
		await tree.init();

		for (const problem of tree.trimmedTree.problems) {
			console.log(`Testing solutions from problem ${ problem.name }.`);
			const runResult = await cpValidator.testSolutions(
				tree.getSolutions(problem.name),
				tree.getAllIo(problem.name)
			);
			console.log(runResult);
		}
	} catch(e) {
		console.log(e);
	}
}
//test2();

module.exports = {
	pushEvent
};

