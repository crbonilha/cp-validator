import Cache from "../libs/cache";


export default class TestCase {
	readonly sha: string;
	readonly name: string;
	readonly type: string;


	constructor(
		sha:  string,
		name: string,
		type: string,
	) {
		this.sha  = sha;
		this.name = name;
		this.type = type;
	}


	getFileContent(): string {
		return Cache.getFileContent(this.sha, this.name);
	}
}

