const octokitAuthApp = require('@octokit/auth-app');
const octokitRest    = require('@octokit/rest');

async function createJWT(
		installationId) {
	try {
		const auth = octokitAuthApp.createAppAuth({
			appId:          process.env.GITHUB_APP_IDENTIFIER,
			privateKey:     process.env.PRIVATE_KEY.replace(/\\n/gm, '\n'),
			installationId: installationId,
			clientId:       process.env.GITHUB_APP_CLIENT_ID,
			clientSecret:   process.env.GITHUB_APP_CLIENT_SECRET
		});

		const authResult = await auth({ type: 'installation' });
		return authResult.token;
	} catch(e) {
		console.log('Failed to authenticate to Github');
		console.log(e);
		throw e;
	}
}

async function getClient(
		installationId) {
	const jwt = await createJWT(installationId);

	const octokit = new octokitRest.Octokit({
		auth: jwt
	});

	return octokit;
}

module.exports = {
	getClient: getClient
};
