import * as crypto from "crypto";

import Debug from "debug";
import express from "express";
import { createAppAuth } from "@octokit/auth-app";
import * as octokitRest from "@octokit/rest";


const debug = Debug('libs:auth');
const sigHeaderName: string = 'X-Hub-Signature';


async function createJWT(
	installationId: number,
	repositoryId:   number
): Promise<string> {
	try {
		const auth: any = createAppAuth({
			appId:          process.env.GITHUB_APP_IDENTIFIER,
			privateKey:     process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
			clientId:       process.env.GITHUB_APP_CLIENT_ID,
			clientSecret:   process.env.GITHUB_APP_CLIENT_SECRET
		});

		debug(`Fetching JWT.`);
		const authResult: any = await auth({
			type:           'installation',
			installationId: installationId,
			repositoryIds:  [ repositoryId ]
		});
		debug(`Successful fetch.`);
		return authResult.token;
	} catch(e) {
		debug(`Failed to fetch JWT.`);
		throw e;
	}
}


export async function getClient(
	installationId: number,
	repositoryId:   number
): Promise<any> {
	const jwt: string = await createJWT(installationId, repositoryId);

	const octokit: any = new octokitRest.Octokit({
		auth: jwt
	});

	return octokit;
}


export function validateWebhookMiddleware(
	req:  express.Request,
	res:  express.Response,
	next: express.NextFunction
): void {
	debug(`Validating request source (github).`);

	const payload: any = req.body;
	if(!payload) {
		return next('Request body empty');
	}

	const sig: string = req.get(sigHeaderName) || '';
	const hmac: any = crypto.createHmac('sha1', process.env.GITHUB_WEBHOOK_SECRET);
	const digest: Buffer = Buffer.from('sha1=' + hmac.update(JSON.stringify(payload)).digest('hex'), 'utf8');
	const checksum: Buffer = Buffer.from(sig, 'utf8');
	if(checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${checksum}).`);
	}
	return next();
}

