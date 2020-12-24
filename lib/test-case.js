const util = require('./util');

class TestCase {
	constructor(
			name,
			content,
			type,
			verbose = false) {
		this.name    = name;
		this.content = content;
		this.type    = type;
		this.verbose = verbose;
	}

	async init() {
		this.filePath = await util.writeFile(
			this.content,
			`.${ this.type }`,
			this.verbose
		);
	}

	destroy() {
		util.deleteFile(
			this.filePath,
			this.verbose
		);
		this.filePath = undefined;
	}
}

module.exports = TestCase;

