import assert from "assert";


// sample: problems/some-problem/...
const problemRegex: RegExp = /^problems\/([\w-]+)\//i;

// sample: problems/some-problem/solutions/cristhian-ac.cpp
const solutionRegex: RegExp = /^problems\/([\w-]+)\/solutions\/([\w-]+\.\w+)$/i;

// sample: problems/some-problem/io/2/3.in
const ioRegex: RegExp = /^problems\/([\w-]+)\/io\/(\d+)\/(\d+)\.(in|out)$/i;

// sample: problems/some-problem/validators/positive-number.cpp
const validatorRegex: RegExp = /^problems\/([\w-]+)\/validators\/([\w-]+\.\w+)$/i;


export interface IoRegexResult {
	folder: number;
	number: number;
	type:   string;
}


export function isProblemFolder(
	path: string
): boolean {
	return problemRegex.test(path);
}


export function isSolutionFile(
	path: string
): boolean {
	return solutionRegex.test(path);
}


export function isValidatorFile(
	path: string
): boolean {
	return validatorRegex.test(path);
}


export function isIoFile(
	path: string
): boolean {
	return ioRegex.test(path);
}


export function getProblemName(
	path: string
): string {
	assert(
		isProblemFolder(path),
		'The specified path doesn\'t correspond to a problem folder.'
	);

	return problemRegex.exec(path)[1];
}


export function getSolutionName(
	path: string
): string {
	assert(
		isSolutionFile(path),
		'The specified path doesn\'t correspond to a solution file.'
	);

	return solutionRegex.exec(path)[2];
}


export function getValidatorName(
	path: string
): string {
	assert(
		isValidatorFile(path),
		'The specified path doesn\'t correspond to a validator file.'
	);

	return validatorRegex.exec(path)[2];
}


export function getIo(
	path: string
): IoRegexResult {
	assert(
		isIoFile(path),
		'The specified path doesn\'t correspond to an io file.'
	);

	const regexResponse = ioRegex.exec(path);
	return {
		folder: Number(regexResponse[2]),
		number: Number(regexResponse[3]),
		type:   regexResponse[4]
	};
}

