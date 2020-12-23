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
test();

app.post('/github', async (req, res) => {
	console.log('got a post request on github');

	if(req.body !== null && req.body.ref === 'refs/heads/main') {
		const installationId = req.body.installation.id;
		try {
			const octokit = await auth.getClient(installationId);

			const result = await octokit.repos.createCommitComment({
				owner: req.body.repository.owner.name,
				repo: req.body.repository.name,
				commit_sha: req.body.head_commit.id,
				body: 'testing'
			});
		} catch(e) {
			console.log(e);
		}
	}

	res.sendStatus(200);
});

app.post('/webhook', (req, res) => {
	console.log('got a post request on webhook');

	return res.sendStatus(200);

	gitManagement.cloneRepo(req.body.repository.html_url)
	.then(targetPath => {
		return cpValidator.testSolutions(targetPath + '/');
	})
	.then(validationResult => {
		res
		.status(200)
		.send(validationResult);
	})
	.catch(err => {
		res
		.status(500)
		.send({
			error: err
		});
	});
});

app.listen(port, () => {
	console.log('listening on port ' + port);
});

