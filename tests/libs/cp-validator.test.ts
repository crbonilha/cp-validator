import assert from "assert";
import sinon from "sinon";

import Cache from "../../src/libs/cache";
import TestHelper from "../test-helper";
import * as TestObjects from "../test-objects";
import Solution from "../../src/models/solution";
import {
	AggregatedVerdict,
	AggregatedValidatorVerdict,
	testSolutions,
	validateInputs
} from "../../src/libs/cp-validator";


describe('cp-validator', () => {
	let cacheGetTempDirStub = null;

	afterEach(() => {
		if(cacheGetTempDirStub) {
			cacheGetTempDirStub.restore();
		}
		cacheGetTempDirStub = null;
	});


	describe('testSolutions', () => {
		it('should return an empty list if given empty inputs', async () => {
			const result: AggregatedVerdict[] = await testSolutions(
				[],
				[]
			);

			assert.equal(
				result.length,
				0
			);
		});

		it('should return an empty list if given empty list of solutions', async () => {
			const result: AggregatedVerdict[] = await testSolutions(
				[],
				[]
			);

			assert.equal(
				result.length,
				0
			);
		});

		it('should return an empty list if given empty list of inputs', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const acSolution: Solution = await TestObjects.buildSolution(
				'ac-solution.cpp', TestObjects.validCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[acSolution],
				[]
			);

			assert.equal(
				result.length,
				0
			);
		});
	});
});

