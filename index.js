require('dotenv').config();

const bodyParser = require('body-parser');
const express    = require('express');

const auth          = require('./auth');
const cpValidator   = require('./cp-validator');
const gitManagement = require('./git-management');
const RepoHelper    = require('./repo-helper');

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
			null
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

app.post('/github', async (req, res) => {
	console.log('got a post request on github');

	if(req.body === null || req.body.ref !== 'refs/heads/main') {
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

	var commitMessage = '**CP Validator results**:\n\n';
	try {
		const repoHelper = new RepoHelper(
			octokit,
			req.body.repository.owner.name,
			req.body.repository.name,
			req.body.head_commit.id
		);

		const problems = await repoHelper.getProblemNames();
		for (var problem of problems) {
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

			commitMessage += `**Problem ${ problem }**:\n` +
				JSON.stringify(runs) +
				`\n\n`;
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

