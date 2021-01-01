// load environment variables.
import dotenv from "dotenv";
dotenv.config();

import { json, urlencoded } from "body-parser";
import express from "express";

import { validateWebhookMiddleware } from "./libs/auth";

import * as routeGithub from "./routes/github";


const app: express.Application = express();
const port: number = 3000;


app.use(urlencoded({ extended: true }));
app.use(json());


app.post('/github', validateWebhookMiddleware);
app.post('/github', (
	req: express.Request,
	res: express.Response
) => {
	console.log('got a post request on github');

	if(req.get('X-Github-Event') === 'push') {
		return routeGithub.pushEvent(req, res);
	}
	else {
		return res.sendStatus(200);
	}
});


app.get('/', (
	req: express.Request,
	res: express.Response
) => {
	return res.status(200).send('all good');
});


app.listen(port, () => {
	console.log('listening on port ' + port);
});

