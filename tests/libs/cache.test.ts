import assert from "assert";
import fs from "fs";
import sinon from "sinon";

import Cache from "../../src/libs/cache";


const testTempDir: string = './temp/test';


describe('cache', () => {
	describe('getFilePath', () => {
		it('should return the correct file path', () => {
			assert.equal(
				Cache.getFilePath('a', 'b'),
				`${ Cache.tempDir }/a-b`
			);
		});
	});

	describe('fileAtPathExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			assert.equal(
				Cache.fileAtPathExists(`${ testTempDir }/notExistentFile.txt`),
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
				Cache.fileAtPathExists(`${ testTempDir }/existentFile.txt`)
			);
		});
	});

	describe('fileExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('non', 'existent')
				.returns(`${ testTempDir }/non-existent`);

			assert.equal(
				Cache.fileExists('non', 'existent'),
				false
			);

			stub.restore();
		});
		it('should find a file that exists', () => {
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('a', 'b')
				.returns(`${ testTempDir }/pro-existent`);

			createFileIfDoesntExist(
				testTempDir,
				'pro-existent',
				'testContent'
			);

			assert(
				Cache.fileExists('a', 'b')
			);

			stub.restore();
		});
	});

	describe('checkAndMaybeDownload', () => {
		it('should download a file that doesn\'t exist', async () => {
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('a', 'b')
				.returns(`${ testTempDir }/deletable-file`);

			deleteFileIfExists(
				testTempDir,
				'deletable-file'
			);

			await Cache.checkAndMaybeDownload(
				'a',
				'b',
				downloadCallback
			);

			assert(
				fs.readFileSync(
					`${ testTempDir }/deletable-file`,
					{ encoding: 'utf8' }
				),
				'testing'
			);

			stub.restore();
		});
		it('should not download a file that exists', async () => {
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('a', 'b')
				.returns(`${ testTempDir }/existent-file`);

			const callbackSpy = sinon.spy();

			createFileIfDoesntExist(
				testTempDir,
				'existent-file',
				'content'
			);

			await Cache.checkAndMaybeDownload(
				'a',
				'b',
				callbackSpy
			);

			assert.equal(
				callbackSpy.called,
				false
			);

			stub.restore();
		});
	});
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

function deleteFileIfExists(
	dir:      string,
	fileName: string
): void {
	const filePath: string = `${ dir }/${ fileName }`;

	if(fs.existsSync(filePath)) {
		fs.unlinkSync(filePath);
	}
}

function downloadCallback(): Promise<any> {
	return Promise.resolve({
		data: {
			content: 'dGVzdGluZw=='
		}
	});
}

