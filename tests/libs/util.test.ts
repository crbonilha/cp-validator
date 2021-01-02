import assert from "assert";

import * as util from "../../src/libs/util";

describe('util', () => {
	describe('getLanguage', () => {
		it('should return the suffix after the dot', () => {
			assert.equal(
				util.getLanguage('something.cpp'),
				'cpp'
			);
		});
		it('should return the suffix even if there\'s more than one dot', () => {
			assert.equal(
				util.getLanguage('something.else.cpp'),
				'cpp'
			);
		});
		it('should return \'unknown\' in case there\'s no dot', () => {
			assert.equal(
				util.getLanguage('something'),
				'unknown'
			);
		});
	});

	describe('decodeResponse', () => {
		it('should decode the response from base64', () => {
			assert.equal(
				util.decodeResponse('dGVzdGluZw=='),
				'testing'
			);
		});
	});

	describe('getFileNameFromPath', () => {
		it('should return the last word after a slash', () => {
			assert.equal(
				util.getFileNameFromPath('folder/fileName.cpp'),
				'fileName.cpp'
			);
		});
		it('should return the last word after a slash, even if there\'s more than one slash', () => {
			assert.equal(
				util.getFileNameFromPath('folder/subfolder/fileName.cpp'),
				'fileName.cpp'
			);
		});
		it('should return the path in case there\'s no slash', () => {
			assert.equal(
				util.getFileNameFromPath('fileName.cpp'),
				'fileName.cpp'
			);
		});
	});
});
