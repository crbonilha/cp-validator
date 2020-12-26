require('dotenv').config();

const bodyParser = require('body-parser');
const express    = require('express');

const auth        = require('./lib/auth');
const cpValidator = require('./lib/cp-validator');
const Tree        = require('./lib/tree');
const RepoHelper  = require('./lib/repo-helper');
const Solution    = require('./lib/solution');

const app  = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function test() {
	try {
		const octokit = await auth.getClient(13698200);

		const repoHelper = new RepoHelper(
			octokit,
			'crbonilha',
			'sample-contest',
			undefined,
			true
		);

		const solutions = await repoHelper.getSolutions(
			'sample-problem'
		);
		console.log(solutions);

		const ios = await repoHelper.getIos(
			'sample-problem'
		);
		console.log(ios);

		const runs = await cpValidator.testSolutions(
			solutions,
			ios
		);
		console.log(runs);
	} catch(e) {
		console.log(e);
	}
}
//test();

async function test2() {
	try {
		const octokit = await auth.getClient(13698200);

		const tree = new Tree(
			octokit,
			'crbonilha',
			'sample-contest',
			'main'
		);
		await tree.init();
		console.log(tree.tree);

		tree.trimTree();
		console.log(tree.trimmedTree);

		await tree.downloadFiles();
	} catch(e) {
		console.log(e);
	}
}
test2();

app.post('/github', auth.validateWebhookMiddleware);
app.post('/github', async (req, res) => {
	console.log('got a post request on github');

	if(req.get('X-Github-Event') !== 'push') {
		return res.sendStatus(200);
	}

	var octokit;
	try {
		const installationId = req.body.installation.id;
		octokit = await auth.getClient(installationId);
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

	var commitMessage = '# CP Validator results\n\n';
	try {
		const repoHelper = new RepoHelper(
			octokit,
			req.body.repository.owner.name,
			req.body.repository.name,
			req.body.head_commit.id,
			true
		);

		const problems = await repoHelper.getProblemNames();
		for (const problem of problems) {
			commitMessage += `## Problem ${ problem }\n\n`;

			const solutions = await repoHelper.getSolutions(
				problem
			);
			const ios = await repoHelper.getIos(
				problem
			);

			const runs = await cpValidator.testSolutions(
				solutions,
				ios
			);

			commitMessage += `### Solutions\n\n`;
			for (const solution in runs) {
				commitMessage += `**- ${ solution }**:\n`;
				for (var verdict in runs[solution]) {
					commitMessage += `${ verdict }: ${ runs[solution][verdict] }\n`;
				}
				commitMessage += `\n`;
			}

			for (const solution of solutions) {
				solution.destroy();
			}
			for (const io of ios) {
				io.input.destroy();
				io.output.destroy();
			}
		}
	} catch(e) {
		commitMessage = e;
	}

	const result = await octokit.repos.createCommitComment({
		owner:      req.body.repository.owner.name,
		repo:       req.body.repository.name,
		commit_sha: req.body.head_commit.id,
		body:       commitMessage
	});
});

app.listen(port, () => {
	console.log('listening on port ' + port);
});

