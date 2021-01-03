import assert from "assert";

import * as execHelper from "../../src/libs/exec-helper";
import TestHelper from "../test-helper";


describe('exec-helper', () => {
	describe('getCompileOutputPath', () => {
		it('should return the path with the \'.exe\' suffix', () => {
			assert.equal(
				execHelper.getCompileOutputPath('path'),
				'path.exe'
			);
		});
	});

	describe('compile', () => {
		it('should throw when the file doesnt exist', async () => {
			await assert.rejects(
				execHelper.compile(
					`${ TestHelper.testTempDir }/non-existent`,
					'cpp'
				)
			);
		});

		it('should throw when the language is not supported', async () => {
			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'existent-file',
				'content'
			);

			await assert.rejects(
				execHelper.compile(
					`${ TestHelper.testTempDir }/existent-file`,
					'java'
				)
			);
		});

		it('should compile a valid cpp code', async () => {
			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'valid-cpp-code.cpp',
				validCppSource
			);

			await assert.doesNotReject(
				execHelper.compile(
					`${ TestHelper.testTempDir }/valid-cpp-code.cpp`,
					'cpp'
				)
			);
		});

		it('should throw when failing to compile an invalid cpp code', async () => {
			TestHelper.createFileIfDoesntExist(
				TestHelper.testTempDir,
				'invalid-cpp-code.cpp',
				compilationErrorCppSource
			);

			await assert.rejects(
				execHelper.compile(
					`${ TestHelper.testTempDir }/invalid-cpp-code.cpp`,
					'cpp'
				)
			);
		});
	});

	describe('run', () => {
		it('should throw when the bin doesnt exist', async () => {
			await assert.rejects(
				execHelper.run(
					`${ TestHelper.testTempDir }/non-existent.exe`,
					`${ TestHelper.testTempDir }/non-existent.in`
				)
			);
		});

		it('should throw when the input doesnt exist', async () => {
			const sourcePath: string = await createFileAndCompileCode(
				'valid-cpp-code.cpp',
				validCppSource
			);

			await assert.rejects(
				execHelper.run(
					sourcePath,
					`${ TestHelper.testTempDir }/non-existent.in`
				)
			);
		});

		it('should be killed if the code doesnt finish before the timelimit', async () => {
			const sourcePath: string = await createFileAndCompileCode(
				'slow-cpp-code.cpp',
				tleCppSource
			);
			const inputFile: string = createInputFile();

			const runResult: execHelper.RunResult = await execHelper.run(
				`${ sourcePath }.exe`,
				inputFile
			);
			assert(runResult.killed);
			assert.equal(runResult.signal, 'SIGTERM');
		}); 

		it('should be killed if there\'s a segmentation fault', async () => {
			const sourcePath: string = await createFileAndCompileCode(
				'segmentation-cpp-code.cpp',
				segmentationCppSource
			);
			const inputFile: string = createInputFile();

			const runResult: execHelper.RunResult = await execHelper.run(
				`${ sourcePath }.exe`,
				inputFile
			);
			assert(runResult.killed);
			assert.equal(runResult.signal, 'SIGSEGV');
		});

		// TODO
		/*
		it('should be killed if it allocs too much memory', async () => {
			const sourcePath: string = await createFileAndCompileCode(
				'memory-cpp-code.cpp',
				memoryCppSource
			);
			const inputFile: string = createInputFile();

			const runResult: execHelper.RunResult = await execHelper.run(
				`${ sourcePath }.exe`,
				inputFile
			);
			assert(runResult.killed);
			console.log(runResult);
		});
		*/

		it('should return the output', async () => {
			const sourcePath: string = await createFileAndCompileCode(
				'valid-cpp-code.cpp',
				validCppSource
			);
			const inputFile: string = createInputFile();

			const runResult: execHelper.RunResult = await execHelper.run(
				`${ sourcePath }.exe`,
				inputFile
			);
			assert(!runResult.killed);
			assert.equal(runResult.output, '6\n');
		});
	});
});


async function createFileAndCompileCode(
	fileName:   string,
	fileSource: string,
	language:   string = 'cpp'
): Promise<string> {
	TestHelper.createFileIfDoesntExist(
		TestHelper.testTempDir,
		fileName,
		fileSource
	);

	const filePath: string = `${ TestHelper.testTempDir }/${ fileName }`;
	await execHelper.compile(
		filePath,
		language
	);
	return filePath;
}

function createInputFile(): string {
	return TestHelper.createFileIfDoesntExist(
		TestHelper.testTempDir,
		'input.txt',
		'2 4'
	);
}

const validCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int a, b;
		scanf("%d %d", &a, &b);
		printf("%d\\n", a+b);
		return 0;
	}
`;
const compilationErrorCppSource: string = `
	#include <bits/stdc++.h>
	int man() {
		return 0;
	}
`;
const tleCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int aux = 0;
		for(int i=0; i<1e9; i++) {
			aux += rand()%1000;
		}
		printf("%d\\n", aux);
	}
`;
const segmentationCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int v[10];
		int aux;
		for(int i=0; i<1e9; i++) {
			aux += v[i];
		}
	}
`;
const memoryCppSource: string = `
	#include <bits/stdc++.h>
	using namespace std;
	int main() {
		vector<int> v(1e9);
		for(int i=0; i<1e9; i++) {
			v.push_back(rand()%1000);
		}
	}
`;
