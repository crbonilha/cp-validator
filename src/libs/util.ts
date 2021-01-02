
export function getLanguage(
	fileName: string
): string {
	const lastDotIndex = fileName.lastIndexOf('.');
	if(lastDotIndex === -1) {
		return 'unknown';
	}
	else {
		return fileName.substr(lastDotIndex+1);
	}
}


export function decodeResponse(
	encodedMessage: string,
	base:           BufferEncoding = 'base64'
): string {
	return Buffer.from(encodedMessage, base).toString('ascii');
}


export function getFileNameFromPath(
	path: string
): string {
	const lastSlashIndex = path.lastIndexOf('/');
	if(lastSlashIndex === -1) {
		return path;
	}
	else {
		return path.substr(lastSlashIndex+1);
	}
}

