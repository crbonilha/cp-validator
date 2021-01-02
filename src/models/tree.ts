import * as cache from "../libs/cache";
import * as regex from "../libs/regex";
import * as util from "../libs/util";

import Solution from "./solution";
import TestCase from "./test-case";
import Validator from "./validator";


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

	private tree:        any;
	private trimmedTree: TreeInterface;


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
		const response: any = await this.octokit.git.getTree({
			owner:     this.owner,
			repo:      this.repo,
			tree_sha:  this.sha,
			recursive: true
		});

		this.tree = response.data.tree;

		this.trimTree();

		await this.downloadFiles();
	}


	private getBlob(
		file_sha: string
	): Promise<any> {
		console.log(`Downloading ${ file_sha }.`);
		return this.octokit.git.getBlob({
			owner:    this.owner,
			repo:     this.repo,
			file_sha: file_sha
		});
	}


	private trimTree(): void {
		if(this.tree === undefined) {
			throw `Trying to download files from tree before initializing the tree.`;
		}
		console.log(`Trimming tree.`);

		this.trimmedTree = {
			problems: []
		};

		for (const treeItem of this.tree) {
			if(treeItem.type !== 'blob') {
				continue;
			}

			if(!regex.isSolutionFile(treeItem.path) &&
				!regex.isIoFile(treeItem.path) &&
				!regex.isValidatorFile(treeItem.path)) {
				continue;
			}

			const problemName = regex.getProblemName(treeItem.path);
			if(!this.trimmedTree.problems.some(p => p.name === problemName)) {
				this.trimmedTree.problems.push({
					name:       problemName,
					ioFolders:  [],
					solutions:  [],
					validators: []
				});
			}
			const problemTree = this.trimmedTree.problems.find(p => p.name === problemName);

			if(regex.isSolutionFile(treeItem.path)) {
				const regexResult = regex.getSolution(treeItem.path);

				problemTree.solutions.push(
					new Solution(
						treeItem.sha,
						util.getFileNameFromPath(treeItem.path)
					)
				);
			}
			else if(regex.isIoFile(treeItem.path)) {
				const regexResult = regex.getIo(treeItem.path);

				if(!problemTree.ioFolders.some(io => io.folder === regexResult.folder)) {
					problemTree.ioFolders.push({
						folder: regexResult.folder,
						ios:    []
					});
				}
				const ioFolder = problemTree.ioFolders.find(io => io.folder === regexResult.folder);

				if(!ioFolder.ios.some(io => io.number === regexResult.number)) {
					ioFolder.ios.push({
						number: regexResult.number
					});
				}
				const ioObj = ioFolder.ios.find(io => io.number === regexResult.number);

				ioObj[ regexResult.type ] = new TestCase(
					treeItem.sha,
					`${ ioFolder.folder }-${ ioObj.number }-${ regexResult.type }`,
					regexResult.type
				);
			}
			else if(regex.isValidatorFile(treeItem.path)) {
				const regexResult = regex.getValidator(treeItem.path);

				problemTree.validators.push(
					new Validator(
						treeItem.sha,
						util.getFileNameFromPath(treeItem.path)
					)
				);
			}
		}
	}


	private async downloadFiles(): Promise<void> {
		if(this.trimmedTree === undefined) {
			throw `Trying to download files from tree before trimming it.`;
		}

		for (const problem of this.trimmedTree.problems) {
			for (const solution of problem.solutions) {
				await cache.checkAndMaybeDownload(
					solution.sha,
					solution.name,
					this.getBlob.bind(this, solution.sha)
				);
			}

			for (const ioFolder of problem.ioFolders) {
				for (const io of ioFolder.ios) {
					if(io.in !== undefined) {
						await cache.checkAndMaybeDownload(
							io.in.sha,
							io.in.name,
							this.getBlob.bind(this, io.in.sha)
						);
					}
					if(io.out !== undefined) {
						await cache.checkAndMaybeDownload(
							io.out.sha,
							io.out.name,
							this.getBlob.bind(this, io.out.sha)
						);
					}
				}
			}

			for (const validator of problem.validators) {
				await cache.checkAndMaybeDownload(
					validator.sha,
					validator.name,
					this.getBlob.bind(this, validator.sha)
				);
			}
		}
	}


	getProblemNames(): string[] {
		if(this.trimmedTree === undefined) {
			throw `Trying to get solutions before trimming the tree.`;
		}

		return this.trimmedTree.problems.map(problem => problem.name);
	}


	getSolutions(
		problemName: string
	): Solution[] {
		if(this.trimmedTree === undefined) {
			throw `Trying to get solutions before trimming the tree.`;
		}

		const problem: ProblemInterface =
			this.trimmedTree.problems.find(problem => problem.name === problemName);
		return problem.solutions;
	}


	getAllIo(
		problemName: string
	): IoInterface[] {
		if(this.trimmedTree === undefined) {
			throw `Trying to get io before trimming the tree.`;
		}

		const problem: ProblemInterface =
			this.trimmedTree.problems.find(problem => problem.name === problemName);
		return problem.ioFolders.reduce((acc, cur) => {
			return acc.concat(cur.ios);
		}, []);
	}


	getValidators(
		problemName: string
	): Validator[] {
		if(this.trimmedTree === undefined) {
			throw `Trying to get validators before trimming the tree.`;
		}

		const problem: ProblemInterface =
			this.trimmedTree.problems.find(problem => problem.name === problemName);
		return problem.validators;
	}
}

