require('dotenv').config();

const bodyParser = require('body-parser');
const express    = require('express');

const auth          = require('./auth');
const cpValidator   = require('./cp-validator');
const gitManagement = require('./git-management');

const app  = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/github', async (req, res) => {
	console.log('got a post request on github');
	console.log(req.body);

	if(req.body !== null && req.body.ref === 'refs/heads/master') {
		const installationId = req.body.installation.id;
		console.log(installationId);
		const jwt = await auth.createJWT(installationId);
	}

	res.sendStatus(200);
});

app.post('/webhook', (req, res) => {
	console.log('got a post request');
	console.log(req.body);

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

