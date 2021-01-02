import assert from "assert";

import * as util from "../../src/libs/util";

describe('util', () => {
	describe('getLanguage', () => {
		it('should return the suffix after the dot', () => {
			assert.equal(
				'cpp',
				util.getLanguage('something.cpp')
			);
		});
	});
});
