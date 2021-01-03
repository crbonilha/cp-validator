import Cache from "../libs/cache";


export default class TestCase {
	readonly sha: string;
	readonly name: string;
	readonly type: string;
	readonly verbose: boolean;


	constructor(
		sha: string,
		name: string,
		type: string,
		verbose: boolean = false
	) {
		this.sha     = sha;
		this.name    = name;
		this.type    = type;
		this.verbose = verbose;
	}


	getFileContent(): string {
		return Cache.getFileContent(this.sha, this.name);
	}
}

