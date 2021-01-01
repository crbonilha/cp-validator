
// sample: problems/some-problem/...
const problemRegex = /^problems\/([\w-]+)\//i;

// sample: problems/some-problem/solutions/cristhian-ac.cpp
const solutionRegex = /^problems\/([\w-]+)\/solutions\/([\w-]+\.\w+)$/i;

// sample: problems/some-problem/io/2/3.in
const ioRegex = /^problems\/([\w-]+)\/io\/(\d)\/(\d)\.(in|out)$/i;


export function isSolutionFile(
	str: string
): boolean {
	return solutionRegex.test(str);
}


export function isIoFile(
	str: string
): boolean {
	return ioRegex.test(str);
}


export function getProblemName(
	str: string
): string {
	return problemRegex.exec(str)[1];
}


export function getSolution(
	str: string
): any {
	if(!isSolutionFile(str)) {
		throw `Trying to get solution, but the path doesn't match a solution regex.`;
	}

	const regexResponse = solutionRegex.exec(str);
	return {
		problem:  regexResponse[1],
		solution: regexResponse[2]
	};
}


export function getIo(
	str: string
): any {
	if(!isIoFile(str)) {
		throw `Trying to get io, but the path doesn't match an io regex.`;
	}

	const regexResponse = ioRegex.exec(str);
	return {
		problem: regexResponse[1],
		folder:  regexResponse[2],
		number:  regexResponse[3],
		type:    regexResponse[4]
	};
}

