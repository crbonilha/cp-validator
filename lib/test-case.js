const cache = require('./cache');
const util  = require('./util');

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

