import { DownloadInterface } from "../src/models/tree";
import Solution from "../src/models/solution";


export async function buildSolution(
	name:          string,
	sourceCode:    string,
	shouldCompile: boolean = false
): Promise<Solution> {
	const solution: Solution = new Solution('sha', name);

	await solution.download((): Promise<DownloadInterface> => {
		return Promise.resolve({
			content:  sourceCode,
			encoding: 'ascii'
		});
	});

	if(shouldCompile) {
		await solution.compile();
	}

	return solution;
}


export const validCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int a, b;
		scanf("%d %d", &a, &b);
		printf("%d\\n", a+b);
		return 0;
	}
`;
export const compilationErrorCppSource: string = `
	#include <bits/stdc++.h>
	int man() {
		return 0;
	}
`;
export const tleCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int aux = 0;
		for(int i=0; i<1e9; i++) {
			aux += rand()%1000;
		}
		printf("%d\\n", aux);
	}
`;
export const segmentationCppSource: string = `
	#include <bits/stdc++.h>
	int main() {
		int v[10];
		int aux;
		for(int i=0; i<1e9; i++) {
			aux += v[i];
		}
	}
`;
export const memoryCppSource: string = `
	#include <bits/stdc++.h>
	using namespace std;
	int main() {
		vector<int> v(1e9);
		for(int i=0; i<1e9; i++) {
			v.push_back(rand()%1000);
		}
	}
`;

