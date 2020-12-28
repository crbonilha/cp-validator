const crypto = require('crypto');

const octokitAuthApp = require('@octokit/auth-app');
const octokitRest    = require('@octokit/rest');

const sigHeaderName = 'X-Hub-Signature';

async function createJWT(
		installationId,
		repositoryIds) {
	try {
		const auth = octokitAuthApp.createAppAuth({
			appId:          process.env.GITHUB_APP_IDENTIFIER,
			privateKey:     process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
			clientId:       process.env.GITHUB_APP_CLIENT_ID,
			clientSecret:   process.env.GITHUB_APP_CLIENT_SECRET
		});

		const authResult = await auth({
			type:           'installation',
			installationId: installationId,
			repositoryIds:  repositoryIds
		});
		return authResult.token;
	} catch(e) {
		console.log('Failed to authenticate to Github');
		console.log(e);
		throw e;
	}
}

async function getClient(
		installationId,
		repositoryIds) {
	const jwt = await createJWT(installationId, repositoryIds);

	const octokit = new octokitRest.Octokit({
		auth: jwt
	});

	return octokit;
}

function validateWebhookMiddleware(req, res, next) {
	console.log('validating request to github');

	const payload = req.body;
	if (!payload) {
		return next('Request body empty');
	}

	const sig = req.get(sigHeaderName) || '';
	const hmac = crypto.createHmac('sha1', process.env.GITHUB_WEBHOOK_SECRET);
	const digest = Buffer.from('sha1=' + hmac.update(JSON.stringify(payload)).digest('hex'), 'utf8');
	const checksum = Buffer.from(sig, 'utf8');
	if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
		console.log('doesnt match');
		return next(`Request body digest (${digest}) did not match ${sigHeaderName} (${checksum})`);
	}
	return next();
}

module.exports = {
	getClient,
	validateWebhookMiddleware
};

