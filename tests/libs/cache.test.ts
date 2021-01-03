import assert from "assert";
import fs from "fs";
import sinon from "sinon";

import Cache from "../../src/libs/cache";
import TestHelper from "../test-helper";


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
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('non', 'existent')
				.returns(`${ TestHelper.testTempDir }/non-existent`);

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
				.returns(`${ TestHelper.testTempDir }/pro-existent`);

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
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
				.returns(`${ TestHelper.testTempDir }/deletable-file`);

			TestHelper.deleteFileIfExists(
				TestHelper.testTempDir,
				'deletable-file'
			);

			await Cache.checkAndMaybeDownload(
				'a',
				'b',
				TestHelper.downloadCallback
			);

			assert(
				fs.readFileSync(
					`${ TestHelper.testTempDir }/deletable-file`,
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
				.returns(`${ TestHelper.testTempDir }/existent-file`);

			const callbackSpy = sinon.spy();

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
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

	describe('getFileContent', () => {
		it('should return the file content', () => {
			const stub = sinon.stub(Cache, 'getFilePath');
			stub
				.withArgs('a', 'b')
				.returns(`${ TestHelper.testTempDir }/existent-file`);

			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'existent-file',
				'content'
			);

			assert.equal(
				Cache.getFileContent('a', 'b'),
				'content'
			);

			stub.restore();
		});
	});
});

