import assert from "assert";

import * as regex from "../../src/libs/regex";

describe('regex', () => {
	describe('problem', () => {
		describe('isProblemFolder', () => {
			it('should correctly identify the problem folder', () => {
				assert(
					regex.isProblemFolder('problems/some-problem/solutions/ac.cpp')
				);
			});
			it('should correctly identify when it\'s not a problem folder', () => {
				assert.equal(
					regex.isProblemFolder('README'),
					false
				);
			});
		});
		describe('getProblemName', () => {
			it('should return the problem name', () => {
				assert.equal(
					regex.getProblemName('problems/some-problem/solutions/ac.cpp'),
					'some-problem'
				);
			});
			it('should throw if the path is not from a problem folder', () => {
				assert.throws(
					() => {
						regex.getProblemName('README');
					}
				);
			});
		});
	});

	describe('solution', () => {
		describe('isSolutionFile', () => {
			it('should correctly identify the solution file', () => {
				assert(
					regex.isSolutionFile('problems/some-problem/solutions/ac.cpp')
				);
			});
			it('should correctly identify when it\'s not a solution file', () => {
				assert.equal(
					regex.isSolutionFile('README'),
					false
				);
			});
		});
		describe('getSolutionName', () => {
			it('should return the solution name', () => {
				assert.equal(
					regex.getSolutionName('problems/some-problem/solutions/ac.cpp'),
					'ac.cpp'
				);
			});
			it('should throw if the path is not from a solution file', () => {
				assert.throws(
					() => {
						regex.getSolutionName('README');
					}
				);
			});
		});
	});

	describe('validator', () => {
		describe('isValidatorFile', () => {
			it('should correctly identify the validator file', () => {
				assert(
					regex.isValidatorFile('problems/some-problem/validators/ac.cpp')
				);
			});
			it('should correctly identify when it\'s not a validator file', () => {
				assert.equal(
					regex.isValidatorFile('README'),
					false
				);
			});
		});
		describe('getValidatorName', () => {
			it('should return the validator name', () => {
				assert.equal(
					regex.getValidatorName('problems/some-problem/validators/ac.cpp'),
					'ac.cpp'
				);
			});
			it('should throw if the path is not from a validator file', () => {
				assert.throws(
					() => {
						regex.getValidatorName('README');
					}
				);
			});
		});
	});

	describe('io', () => {
		describe('isIoFile', () => {
			it('should correctly identify the input file', () => {
				assert(
					regex.isIoFile('problems/some-problem/io/1/13.in')
				);
			});
			it('should correctly identify the output file', () => {
				assert(
					regex.isIoFile('problems/some-problem/io/13/2.out')
				);
			});
			it('should correctly identify when it\'s not an io file', () => {
				assert.equal(
					regex.isIoFile('README'),
					false
				);
			});
		});
		describe('getIo', () => {
			it('should return the correct input properties', () => {
				assert.deepStrictEqual(
					regex.getIo('problems/some-problem/io/1/13.in'),
					{
						folder: 1,
						number: 13,
						type:   'in'
					}
				);
			});
			it('should return the correct output properties', () => {
				assert.deepStrictEqual(
					regex.getIo('problems/some-problem/io/2/14.out'),
					{
						folder: 2,
						number: 14,
						type:   'out'
					}
				);
			});
			it('should throw if the path is not from an io file', () => {
				assert.throws(
					() => {
						regex.getIo('README');
					}
				);
			});
		});
	});
});

