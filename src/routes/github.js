
const Bull = require('bull');

const auth        = require('../libs/auth');
const cpValidator = require('../libs/cp-validator');

const Tree = require('../models/tree');

const validateQueue = new Bull('validate-queue', process.env.REDIS_URL);
validateQueue.on('error', err => {
	console.log(err);
	throw err;
});

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
		resolve(commitMessage);
	});
});

validateQueue.on('completed', async (job, result) => {
	console.log('job completed');
	const octokit = await auth.getClient(
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
test2();

module.exports = {
	pushEvent
};

