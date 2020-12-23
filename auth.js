const octokitAuthApp = require('@octokit/auth-app');

async function createJWT(
		installationId) {
	const auth = octokitAuthApp.createAppAuth({
		id:             process.env.GITHUB_APP_IDENTIFIER,
		privateKey:     process.env.PRIVATE_KEY,
		installationId: installationId,
		clientId:       process.env.GITHUB_APP_CLIENT_ID,
		clientSecret:   process.env.GITHUB_APP_CLIENT_SECRET
	});

	const authResult = await auth({ type: 'installation' });
	return authResult.token;
}

module.exports = {
	createJWT: createJWT
};

