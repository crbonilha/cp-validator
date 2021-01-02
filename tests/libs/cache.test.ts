import assert from "assert";
import fs from "fs";

import * as cache from "../../src/libs/cache";

const testTempDir: string = './temp/test';


describe('cache', () => {
	describe('getFilePath', () => {
		it('should return the correct file path', () => {
			assert.equal(
				cache.getFilePath('a', 'b'),
				`${ cache.tempDir }/a-b`
			);
		});
	});

	describe('fileAtPathExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			assert.equal(
				cache.fileAtPathExists(`${ testTempDir }/notExistentFile.txt`),
				false
			);
		});
		it('should find a file that exists', () => {
			createFileIfDoesntExist(
				testTempDir,
				'existentFile.txt',
				'testContent'
			);
			assert(
				cache.fileAtPathExists(`${ testTempDir }/existentFile.txt`)
			);
		});
	});

	/*
	describe('fileExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			assert.equal(
				cache.fileExists(`${ testTempDir }/notExistentFile.txt`),
				false
			);
		});
		it('should find a file that exists', () => {
			createFileIfDoesntExist(
				testTempDir,
				'existentFile.txt',
				'testContent'
			);
			assert(
				cache.fileAtPathExists(`${ testTempDir }/existentFile.txt`)
			);
		});
	});
	*/
});


function createFileIfDoesntExist(
	dir:      string,
	fileName: string,
	content:  string
): void {
	if(!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const filePath: string = `${ dir }/${ fileName }`;

	if(!fs.existsSync(filePath)) {
		fs.writeFileSync(
			filePath,
			content,
			{
				encoding: 'utf8'
			}
		);
	}
}

