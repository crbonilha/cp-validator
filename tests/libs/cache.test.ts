import assert from "assert";
import fs from "fs";
import sinon from "sinon";

import Cache from "../../src/libs/cache";
import TestHelper from "../test-helper";


describe('cache', () => {
	let cacheGetTempDirStub = null;

	afterEach(() => {
		if(cacheGetTempDirStub) {
			cacheGetTempDirStub.restore();
		}
		cacheGetTempDirStub = null;
	});


	describe('getFilePath', () => {
		it('should return the correct file path', () => {
			assert.equal(
				Cache.getFilePath('a', 'b'),
				`${ Cache.getTempDir() }/a-b`
			);
		});
	});

	describe('fileAtPathExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			assert.equal(
				Cache.fileAtPathExists(`${ TestHelper.testTempDir }/notExistentFile.txt`),
				false
			);
		});
		it('should find a file that exists', () => {
			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'existentFile.txt',
				'testContent'
			);

			assert(
				Cache.fileAtPathExists(`${ TestHelper.testTempDir }/existentFile.txt`)
			);
		});
	});

	describe('fileExists', () => {
		it('should not find a file that doesn\'t exist', () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);

			assert.equal(
				Cache.fileExists('non', 'existent'),
				false
			);
		});
		it('should find a file that exists', () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'pro-existent',
				'testContent'
			);

			assert(
				Cache.fileExists('a', 'b')
			);
		});
	});

	describe('checkAndMaybeDownload', () => {
		it('should download a file that doesn\'t exist', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);

			TestHelper.deleteFileIfExists(
				TestHelper.testTempDir,
				'deletable-file'
			);

			await Cache.checkAndMaybeDownload(
				'deletable',
				'file',
				TestHelper.downloadCallback
			);

			assert(
				fs.readFileSync(
					`${ TestHelper.testTempDir }/deletable-file`,
					{ encoding: 'utf8' }
				),
				'testing'
			);
		});
		it('should not download a file that exists', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);

			const callbackSpy = sinon.spy();

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'existent-file',
				'content'
			);

			await Cache.checkAndMaybeDownload(
				'existent',
				'file',
				callbackSpy
			);

			assert.equal(
				callbackSpy.called,
				false
			);
		});
	});

	describe('getFileContent', () => {
		it('should return the file content', () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'existent-file',
				'content'
			);

			assert.equal(
				Cache.getFileContent('existent', 'file'),
				'content'
			);
		});
	});
});

