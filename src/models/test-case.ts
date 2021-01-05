import File from "./file-class";


export default class TestCase extends File {
	readonly type: string;


	constructor(
		sha:  string,
		name: string,
		type: string
	) {
		super(sha, name);

		this.type = type;
	}
}

