
const problemRegex = /^problems\/([\w-]+)\//i;

// sample: problems/some-problem/solutions/cristhian-ac.cpp
const solutionRegex = /^problems\/([\w-]+)\/solutions\/([\w-]+\.\w+)$/i;

// sample: problems/some-problem/io/2/3.in
const ioRegex = /^problems\/([\w-]+)\/io\/(\d)\/(\d)\.(in|out)$/i;

function isSolutionFile(
		str) {
	return solutionRegex.test(str);
}

function isIoFile(
		str) {
	return ioRegex.test(str);
}

function getProblemName(
		str) {
	return problemRegex.exec(str)[1];
}

function getSolution(
		str) {
	if(!isSolutionFile(str)) {
		throw `Trying to get solution, but the path doesn't match a solution regex.`;
	}

	const regexResponse = solutionRegex.exec(str);
	return {
		problem:  regexResponse[1],
		solution: regexResponse[2]
	};
}

function getIo(
		str) {
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

module.exports = {
	isSolutionFile,
	isIoFile,
	getProblemName,
	getSolution,
	getIo
};

