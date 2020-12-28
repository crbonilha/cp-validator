const cache = require('../libs/cache');

class TestCase {
	constructor(
			sha,
			name,
			type,
			verbose = false) {
		this.sha     = sha;
		this.name    = name;
		this.type    = type;
		this.verbose = verbose;
	}

	getFileContent() {
		return cache.getFileContent(this.sha, this.name);
	}
}

module.exports = TestCase;

