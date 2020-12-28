require('dotenv').config();

const bodyParser = require('body-parser');
const express    = require('express');

const auth        = require('./libs/auth');

const routeGithub = require('./routes/github');

const app  = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/github', auth.validateWebhookMiddleware);
app.post('/github', (req, res) => {
	console.log('got a post request on github');

	if(req.get('X-Github-Event') === 'push') {
		return routeGithub.pushEvent(req, res);
	}
	else {
		return res.sendStatus(200);
	}
});

app.listen(port, () => {
	console.log('listening on port ' + port);
});

