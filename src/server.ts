// load environment variables.
import dotenv from "dotenv";
dotenv.config();

import { json, urlencoded } from "body-parser";
import Debug from "debug";
import express from "express";

import { validateWebhookMiddleware } from "./libs/auth";

import * as routeGithub from "./routes/github";


const app: express.Application = express();
const port: number = 3000;
const debug = Debug('app');

app.use(urlencoded({ extended: true }));
app.use(json());


app.post('/github', validateWebhookMiddleware);
app.post('/github', (
	req: express.Request,
	res: express.Response
) => {
	debug(`Got a POST request on /github.`);

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
	debug(`Listening on port ${ port }.`);
});

