import assert from "assert";
import sinon from "sinon";

import Cache from "../../src/libs/cache";
import TestHelper from "../test-helper";
import * as TestObjects from "../test-objects";
import Solution from "../../src/models/solution";
import TestCase from "../../src/models/test-case";
import { IoInterface } from "../../src/models/tree";
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
				[], []);

			assert.equal(result.length, 0);
		});

		it('should return an empty list if given empty list of solutions', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const io: IoInterface = await getIo();

			const result: AggregatedVerdict[] = await testSolutions(
				[], [io]);

			assert.equal(result.length, 0);
		});

		it('should return an empty list if given empty list of inputs', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const acSolution: Solution = await TestObjects.buildSolution(
				'ac-solution.cpp', TestObjects.validCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[acSolution], []);

			assert.equal(result.length, 0);
		});

		it('should return a consistent aggregated verdict with ac result', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const io: IoInterface = await getIo();
			const acSolution: Solution = await TestObjects.buildSolution(
				'ac-solution.cpp', TestObjects.validCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[acSolution], [io]);

			assert.equal(result.length, 1);
			assert.deepStrictEqual(
				result[0],
				{
					solutionName: 'ac-solution.cpp',
					total:        1,
					accepted: {
						count:         1,
						testCaseNames: []
					}
				});
		});

		it('should return a consistent aggregated verdict with wa result', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const io: IoInterface = await getIo();
			const waSolution: Solution = await TestObjects.buildSolution(
				'wa-solution.cpp', TestObjects.waCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[waSolution], [io]);

			assert.equal(result.length, 1);
			assert.deepStrictEqual(
				result[0],
				{
					solutionName: 'wa-solution.cpp',
					total:        1,
					accepted: {
						count:         0,
						testCaseNames: []
					},
					wrongAnswer: {
						count:         1,
						testCaseNames: [
							'input.in'
						]
					}
				});
		});

		it('should return a consistent aggregated verdict with tle result', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const io: IoInterface = await getIo();
			const tleSolution: Solution = await TestObjects.buildSolution(
				'tle-solution.cpp', TestObjects.tleCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[tleSolution], [io]);

			assert.equal(result.length, 1);
			assert.deepStrictEqual(
				result[0],
				{
					solutionName: 'tle-solution.cpp',
					total:        1,
					accepted: {
						count:         0,
						testCaseNames: []
					},
					timeLimitExceeded: {
						count:         1,
						testCaseNames: [
							'input.in'
						]
					}
				});
		});

		it('should return a consistent aggregated verdict with compilation error result', async () => {
			cacheGetTempDirStub = sinon.stub(Cache, 'getTempDir');
			cacheGetTempDirStub.returns(TestHelper.testTempDir);
			const io: IoInterface = await getIo();
			const ceSolution: Solution = await TestObjects.buildSolution(
				'ce-solution.cpp', TestObjects.compilationErrorCppSource);

			const result: AggregatedVerdict[] = await testSolutions(
				[ceSolution], [io]);

			assert.equal(result.length, 1);
			assert.deepStrictEqual(
				result[0],
				{
					solutionName: 'ce-solution.cpp',
					total:        1,
					accepted: {
						count:         0,
						testCaseNames: []
					},
					compilationError: {
						count:         1,
						testCaseNames: []
					}
				});
		});
	});
});


async function getIo(): Promise<IoInterface> {
	const inputTestCase: TestCase = await TestObjects.buildTestCase(
		'input.in', 'in', '1 2\n');
	const outputTestCase: TestCase = await TestObjects.buildTestCase(
		'output.in', 'out', '3\n');

	const io: IoInterface = {
		in:     inputTestCase,
		out:    outputTestCase,
		number: 1
	};

	return io;
}

