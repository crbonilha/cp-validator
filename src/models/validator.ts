import SourceCodeFile from "./source-code-file-class";


export default class Validator extends SourceCodeFile {
	constructor(
		sha:  string,
		name: string
	) {
		super(sha, name);
	}
}

