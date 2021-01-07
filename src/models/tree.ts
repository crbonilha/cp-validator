import assert from "assert";
import Debug from "debug";

import * as regex from "../libs/regex";
import * as util from "../libs/util";

import Cache from "../libs/cache";
import Solution from "./solution";
import TestCase from "./test-case";
import Validator from "./validator";


const debug = Debug('models:tree');


export interface DownloadInterface {
	content:  string;
	encoding: string;
}

export interface IoInterface {
	number: number;
	in?:    TestCase;
	out?:   TestCase;
}

interface IoFolderInterface {
	folder: number;
	ios:    IoInterface[];
}

interface ProblemInterface {
	name:       string;
	solutions:  Solution[];
	ioFolders:  IoFolderInterface[];
	validators: Validator[];
}

interface TreeInterface {
	problems: ProblemInterface[];
}


export default class Tree {
	readonly octokit: any;
	readonly owner:   string;
	readonly repo:    string;
	readonly sha:     string;

	private tree: TreeInterface;


	constructor(
		octokit: any,
		owner:   string,
		repo:    string,
		sha:     string
	) {
		this.octokit = octokit;
		this.owner   = owner;
		this.repo    = repo;
		this.sha     = sha;
	}


	async init(): Promise<void> {
		const treeRawResponse: any[] = await this.fetchRepoTree();

		this.tree = this.trimTree(treeRawResponse);

		await this.downloadFiles();
	}


	private async fetchRepoTree(): Promise<any[]> {
		debug(`Fetching repo tree.`);

		const fetchResponse: any = await this.octokit.git.getTree({
			owner:     this.owner,
			repo:      this.repo,
			tree_sha:  this.sha,
			recursive: true
		});

		return fetchResponse.data.tree;
	}


	private async getBlob(
		file_sha: string
	): Promise<DownloadInterface> {
		debug(`Downloading ${ file_sha }.`);

		const downloadResult: any = await this.octokit.git.getBlob({
			owner:    this.owner,
			repo:     this.repo,
			file_sha: file_sha
		});

		return {
			content:  downloadResult.data.content,
			encoding: downloadResult.data.encoding
		};
	}


	private trimTree(
		rawTreeResponse: any[]
	): TreeInterface {
		debug(`Trimming tree.`);

		const tree: TreeInterface = {
			problems: []
		};

		for(const treeItem of rawTreeResponse) {
			if(treeItem.type !== 'blob') {
				continue;
			}

			if(!regex.isSolutionFile(treeItem.path) &&
				!regex.isIoFile(treeItem.path) &&
				!regex.isValidatorFile(treeItem.path)) {
				continue;
			}

			const problemName: string = regex.getProblemName(treeItem.path);
			if(!tree.problems.some(p => p.name === problemName)) {
				tree.problems.push({
					name:       problemName,
					ioFolders:  [],
					solutions:  [],
					validators: []
				});
			}
			const problemTree: ProblemInterface = tree.problems.find(p => p.name === problemName);

			if(regex.isSolutionFile(treeItem.path)) {
				problemTree.solutions.push(
					new Solution(
						treeItem.sha,
						util.getFileNameFromPath(treeItem.path)
					)
				);
			}
			else if(regex.isIoFile(treeItem.path)) {
				const ioRegexResult: regex.IoRegexResult = regex.getIo(treeItem.path);

				if(!problemTree.ioFolders.some(io => io.folder === ioRegexResult.folder)) {
					problemTree.ioFolders.push({
						folder: ioRegexResult.folder,
						ios:    []
					});
				}
				const ioFolder: IoFolderInterface =
					problemTree.ioFolders.find(io => io.folder === ioRegexResult.folder);

				if(!ioFolder.ios.some(io => io.number === ioRegexResult.number)) {
					ioFolder.ios.push({
						number: ioRegexResult.number
					});
				}
				const ioObj: IoInterface =
					ioFolder.ios.find(io => io.number === ioRegexResult.number);

				ioObj[ ioRegexResult.type ] = new TestCase(
					treeItem.sha,
					`${ ioFolder.folder }-${ ioObj.number }-${ ioRegexResult.type }`,
					ioRegexResult.type
				);
			}
			else if(regex.isValidatorFile(treeItem.path)) {
				problemTree.validators.push(
					new Validator(
						treeItem.sha,
						util.getFileNameFromPath(treeItem.path)
					)
				);
			}
		}

		return tree;
	}


	private async downloadFiles(): Promise<void> {
		assert(this.tree !== undefined,
			`Trying to download files from tree before trimming it.`);
		debug(`Downloading files.`);

		for (const problem of this.tree.problems) {
			for (const solution of problem.solutions) {
				await solution.download(
					this.getBlob.bind(this, solution.sha));
			}

			for (const ioFolder of problem.ioFolders) {
				for (const io of ioFolder.ios) {
					if(io.in !== undefined) {
						await io.in.download(
							this.getBlob.bind(this, io.in.sha));
					}
					if(io.out !== undefined) {
						await io.out.download(
							this.getBlob.bind(this, io.out.sha));
					}
				}
			}

			for (const validator of problem.validators) {
				await validator.download(
					this.getBlob.bind(this, validator.sha));
			}
		}
	}


	getProblemNames(): string[] {
		assert(this.tree !== undefined,
			`Trying to get solutions before trimming the tree.`);

		return this.tree.problems.map(problem => problem.name);
	}


	getSolutions(
		problemName: string
	): Solution[] {
		assert(this.tree !== undefined,
			`Trying to get solutions before trimming the tree.`);

		const problem: ProblemInterface =
			this.tree.problems.find(problem => problem.name === problemName);
		return problem.solutions;
	}


	getAllIo(
		problemName: string
	): IoInterface[] {
		assert(this.tree !== undefined,
			`Trying to get io before trimming the tree.`);

		const problem: ProblemInterface =
			this.tree.problems.find(problem => problem.name === problemName);
		return problem.ioFolders.reduce((acc, cur) => {
			return acc.concat(cur.ios);
		}, []);
	}


	getValidators(
		problemName: string
	): Validator[] {
		assert(this.tree !== undefined,
			`Trying to get validators before trimming the tree.`);

		const problem: ProblemInterface =
			this.tree.problems.find(problem => problem.name === problemName);
		return problem.validators;
	}
}

