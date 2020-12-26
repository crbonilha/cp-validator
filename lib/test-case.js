const util = require('./util');

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
}

module.exports = TestCase;

