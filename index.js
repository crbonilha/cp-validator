const bodyParser = require('body-parser');
const express    = require('express');

const cpValidator   = require('./cp-validator');
const gitManagement = require('./git-management');

const app  = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
	console.log('got a post request');
	console.log(req.body);

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

