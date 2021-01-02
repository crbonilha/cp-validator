
// sample: problems/some-problem/...
const problemRegex: RegExp = /^problems\/([\w-]+)\//i;

// sample: problems/some-problem/solutions/cristhian-ac.cpp
const solutionRegex: RegExp = /^problems\/([\w-]+)\/solutions\/([\w-]+\.\w+)$/i;

// sample: problems/some-problem/io/2/3.in
const ioRegex: RegExp = /^problems\/([\w-]+)\/io\/(\d)\/(\d)\.(in|out)$/i;

// sample: problems/some-problem/validators/positive-number.cpp
const validatorRegex: RegExp = /^problems\/([\w-]+)\/validators\/([\w-]+\.\w+)$/i;


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


export function isValidatorFile(
	str: string
): boolean {
	return validatorRegex.test(str);
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


export function getValidator(
	str: string
): any {
	if(!isValidatorFile(str)) {
		throw `Trying to get validator, but the path doesn't match a validator regex.`;
	}

	const regexResponse = validatorRegex.exec(str);
	return {
		problem:   regexResponse[1],
		validator: regexResponse[2]
	};
}

