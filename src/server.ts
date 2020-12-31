import * as dotenv from "dotenv";
dotenv.config();

import * as bodyParser from "body-parser";
import express from "express";

import * as auth from "./libs/auth";

import * as routeGithub from "./routes/github";

const app: any = express();
const port: number = 3000;

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

