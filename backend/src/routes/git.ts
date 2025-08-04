import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ErrorSchema } from "../models/environment.js";
import {
	GitCheckoutSchema,
	GitInfoSchema,
	GitLogSchema,
} from "../models/git.js";
import {
	createCLIErrorResponse,
	executeGenericCommand,
} from "../utils/cli-executor.js";

// Route to get git information
export const gitInfoRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			folder: z
				.string()
				.min(1)
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Folder path to get git information for",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GitInfoSchema,
				},
			},
			description: "Git repository information",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Folder not found",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Internal server error",
		},
	},
});

// Route to checkout a git branch
export const gitCheckoutRoute = createRoute({
	method: "post",
	path: "/checkout",
	request: {
		query: z.object({
			folder: z
				.string()
				.min(1)
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Folder path for git operations",
				}),
		}),
		body: {
			content: {
				"application/json": {
					schema: z.object({
						branch: z.string().openapi({
							example: "main",
							description: "Branch name to checkout",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GitCheckoutSchema,
				},
			},
			description: "Git checkout result",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Bad request (not a git repository or uncommitted changes)",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Internal server error",
		},
	},
});

// Route to get git log for a branch
export const gitLogRoute = createRoute({
	method: "get",
	path: "/log",
	request: {
		query: z.object({
			folder: z
				.string()
				.min(1)
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Folder path for git operations",
				}),
			branch: z
				.string()
				.min(1)
				.openapi({
					param: {
						name: "branch",
						in: "query",
					},
					example: "main",
					description: "Branch name to get log for",
				}),
			limit: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "limit",
						in: "query",
					},
					example: "10",
					description: "Number of commits to retrieve (default: 10)",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: GitLogSchema,
				},
			},
			description: "Git log result",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Bad request (not a git repository or branch not found)",
		},
		500: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Internal server error",
		},
	},
});

export const git = new OpenAPIHono();

// Types for internal use
interface GitBranch {
	name: string;
	current: boolean;
	remote: boolean;
	upstream?: string;
	ahead?: number;
	behind?: number;
	commitHash?: string;
	commitMessage?: string;
	trackingStatus?: string;
}

interface GitStatus {
	currentBranch: string;
	isRepository: boolean;
	hasUncommittedChanges: boolean;
	branches: GitBranch[];
}

/**
 * Check if a directory is a git repository
 */
async function isGitRepository(folder: string): Promise<boolean> {
	try {
		const gitDir = path.join(folder, ".git");
		const stat = await fs.stat(gitDir);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Get current branch name
 */
async function getCurrentBranch(folder: string): Promise<string | null> {
	try {
		const result = await executeGenericCommand({
			command: "git",
			args: ["rev-parse", "--abbrev-ref", "HEAD"],
			workingDir: folder,
		});

		if (result.code === 0) {
			return result.stdout.trim();
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Get all branches (local and remote) with detailed information
 */
async function getAllBranches(folder: string): Promise<GitBranch[]> {
	try {
		// Use git branch -av to get all branches with verbose information
		const result = await executeGenericCommand({
			command: "git",
			args: ["branch", "-av"],
			workingDir: folder,
		});

		const branches: GitBranch[] = [];

		if (result.code === 0) {
			const lines = result.stdout
				.split("\n")
				.filter((line: string) => line.trim());

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;

				// Skip HEAD references (like "remotes/origin/HEAD -> origin/main")
				if (trimmed.includes("->")) continue;

				const isCurrent = trimmed.startsWith("*");
				const branchInfo = isCurrent ? trimmed.substring(1).trim() : trimmed;

				// Parse the branch line format:
				// branch-name    commit-hash [tracking-info] commit message
				// remotes/origin/branch-name    commit-hash commit message
				const match = branchInfo.match(/^(\S+)\s+([a-f0-9]+)\s*(.*)$/);

				if (!match) continue;

				const [, fullName, commitHash, rest] = match;
				let commitMessage = rest;
				let trackingStatus: string | undefined;
				let upstream: string | undefined;

				// Check for tracking information in brackets like [gone], [ahead 2], [behind 1], etc.
				const trackingMatch = rest.match(/^\[([^\]]+)\]\s*(.*)$/);
				if (trackingMatch) {
					const [, tracking, message] = trackingMatch;
					trackingStatus = tracking;
					commitMessage = message;

					// Extract upstream information if available
					if (tracking.includes("gone")) {
						trackingStatus = "gone";
					} else if (tracking.includes(":")) {
						// Format like "origin/main: ahead 1"
						const parts = tracking.split(":");
						if (parts.length > 0) {
							upstream = parts[0].trim();
							if (parts.length > 1) {
								trackingStatus = parts[1].trim();
							}
						}
					}
				}

				// Determine if it's a remote branch
				const isRemote = fullName.startsWith("remotes/");
				let branchName = fullName;

				if (isRemote) {
					// For remote branches, keep the remote/branch format (e.g., "container-use/social-tapir")
					// but strip the "remotes/" prefix
					const remoteParts = fullName.split("/");
					if (remoteParts.length >= 3) {
						branchName = remoteParts.slice(1).join("/"); // Keep "container-use/social-tapir"
						if (!upstream) {
							upstream = fullName;
						}
					}
				}

				// For local branches, try to get tracking information if not already parsed
				if (!isRemote && !trackingStatus) {
					try {
						const trackingResult = await executeGenericCommand({
							command: "git",
							args: ["status", "-b", "--porcelain=v1"],
							workingDir: folder,
						});

						if (trackingResult.code === 0) {
							const statusLines = trackingResult.stdout.split("\n");
							const branchLine = statusLines.find((line) =>
								line.startsWith("##"),
							);
							if (branchLine?.includes(branchName)) {
								// Parse tracking info from status
								if (branchLine.includes("[gone]")) {
									trackingStatus = "gone";
								} else if (branchLine.includes("[ahead")) {
									const aheadMatch = branchLine.match(/\[ahead (\d+)\]/);
									if (aheadMatch) {
										trackingStatus = `ahead ${aheadMatch[1]}`;
									}
								} else if (branchLine.includes("[behind")) {
									const behindMatch = branchLine.match(/\[behind (\d+)\]/);
									if (behindMatch) {
										trackingStatus = `behind ${behindMatch[1]}`;
									}
								}

								// Extract upstream
								const upstreamMatch = branchLine.match(/\.\.\.([^\s\]]+)/);
								if (upstreamMatch) {
									upstream = upstreamMatch[1];
								}
							}
						}
					} catch {
						// Ignore errors getting tracking info for individual branches
					}
				}

				branches.push({
					name: branchName,
					current: isCurrent,
					remote: isRemote,
					upstream,
					commitHash: commitHash.substring(0, 7), // Short hash
					commitMessage:
						commitMessage.trim().length > 100
							? `${commitMessage.trim().substring(0, 97)}...`
							: commitMessage.trim() || undefined,
					trackingStatus,
				});
			}
		}

		return branches;
	} catch {
		return [];
	}
}

/**
 * Check if there are uncommitted changes
 */
async function hasUncommittedChanges(folder: string): Promise<boolean> {
	try {
		const result = await executeGenericCommand({
			command: "git",
			args: ["status", "--porcelain"],
			workingDir: folder,
		});

		return result.code === 0 && result.stdout.trim().length > 0;
	} catch {
		return false;
	}
}

/**
 * Get git log for a specific branch
 */
async function getGitLog(
	folder: string,
	branch: string,
	limit = 10,
): Promise<{
	branch: string;
	commits: Array<{
		hash: string;
		message: string;
		author: string;
		date: string;
		relative: string;
	}>;
}> {
	try {
		// Use git log with format to get structured data
		const result = await executeGenericCommand({
			command: "git",
			args: [
				"log",
				branch,
				"--oneline",
				"--format=%H|%s|%an|%ai|%ar",
				`-${limit}`,
			],
			workingDir: folder,
		});

		const commits = [];

		if (result.code === 0 && result.stdout.trim()) {
			const lines = result.stdout.split("\n").filter((line) => line.trim());

			for (const line of lines) {
				const parts = line.split("|");
				if (parts.length >= 5) {
					commits.push({
						hash: parts[0].substring(0, 7), // Short hash
						message: parts[1],
						author: parts[2],
						date: parts[3],
						relative: parts[4],
					});
				}
			}
		}

		return {
			branch,
			commits,
		};
	} catch (error) {
		console.error("Error getting git log:", error);
		return {
			branch,
			commits: [],
		};
	}
}

/**
 * Get git status for a folder
 */
async function getGitStatus(folder: string): Promise<GitStatus> {
	const isRepo = await isGitRepository(folder);

	if (!isRepo) {
		return {
			currentBranch: "",
			isRepository: false,
			hasUncommittedChanges: false,
			branches: [],
		};
	}

	const [currentBranch, branches, uncommittedChanges] = await Promise.all([
		getCurrentBranch(folder),
		getAllBranches(folder),
		hasUncommittedChanges(folder),
	]);

	return {
		currentBranch: currentBranch || "",
		isRepository: true,
		hasUncommittedChanges: uncommittedChanges,
		branches,
	};
}

// Mount the git info route
git.openapi(gitInfoRoute, async (c) => {
	try {
		const { folder } = c.req.valid("query");

		// Resolve absolute path
		const absolutePath = path.resolve(folder);

		// Check if folder exists
		try {
			await fs.access(absolutePath);
		} catch {
			const errorResponse = createCLIErrorResponse(
				"Folder not found",
				null,
				"git",
				absolutePath,
			);
			return c.json(errorResponse, 404);
		}

		const gitStatus = await getGitStatus(absolutePath);

		return c.json(
			{
				success: true,
				data: gitStatus,
			},
			200,
		);
	} catch (error) {
		console.error("Error getting git info:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to get git information",
			null,
			"git",
			"unknown",
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the git checkout route
git.openapi(gitCheckoutRoute, async (c) => {
	try {
		const { folder } = c.req.valid("query");
		const { branch } = c.req.valid("json");

		// Resolve absolute path
		const absolutePath = path.resolve(folder);

		// Check if folder exists and is a git repository
		const isRepo = await isGitRepository(absolutePath);
		if (!isRepo) {
			const errorResponse = createCLIErrorResponse(
				"Not a git repository",
				null,
				"git",
				absolutePath,
			);
			return c.json(errorResponse, 400);
		}

		// Check for uncommitted changes
		const hasChanges = await hasUncommittedChanges(absolutePath);
		if (hasChanges) {
			const errorResponse = createCLIErrorResponse(
				"Cannot checkout: uncommitted changes detected",
				null,
				"git checkout",
				absolutePath,
			);
			return c.json(errorResponse, 400);
		}

		// Perform checkout
		let checkoutArgs: string[];

		// Check if it's a remote branch (contains '/')
		if (branch.includes("/")) {
			// For remote branches, create a local tracking branch
			// Extract the branch name (last part after '/')
			const localBranchName = branch.split("/").pop();
			if (!localBranchName) {
				const errorResponse = createCLIErrorResponse(
					"Invalid remote branch name",
					null,
					"git checkout",
					absolutePath,
				);
				return c.json(errorResponse, 400);
			}

			// Use git checkout -b localName remoteName to create tracking branch
			checkoutArgs = ["checkout", "-b", localBranchName, branch];
		} else {
			// For local branches, use regular checkout
			checkoutArgs = ["checkout", branch];
		}

		const result = await executeGenericCommand({
			command: "git",
			args: checkoutArgs,
			workingDir: absolutePath,
		});

		if (result.code !== 0) {
			const errorResponse = createCLIErrorResponse(
				"Failed to checkout branch",
				result,
				"git checkout",
				absolutePath,
			);
			return c.json(errorResponse, 400);
		}

		// Get updated git status
		const gitStatus = await getGitStatus(absolutePath);

		return c.json(
			{
				success: true,
				message: `Successfully checked out branch: ${branch}`,
				data: gitStatus,
			},
			200,
		);
	} catch (error) {
		console.error("Error checking out branch:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to checkout branch",
			null,
			"git checkout",
			"unknown",
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the git log route
git.openapi(gitLogRoute, async (c) => {
	try {
		const { folder, branch, limit } = c.req.valid("query");

		// Resolve absolute path
		const absolutePath = path.resolve(folder);

		// Check if folder exists and is a git repository
		const isRepo = await isGitRepository(absolutePath);
		if (!isRepo) {
			const errorResponse = createCLIErrorResponse(
				"Not a git repository",
				null,
				"git log",
				absolutePath,
			);
			return c.json(errorResponse, 400);
		}

		// Get git log for the specified branch
		const logData = await getGitLog(
			absolutePath,
			branch,
			limit ? parseInt(limit, 10) : 10,
		);

		return c.json(
			{
				success: true,
				data: logData,
			},
			200,
		);
	} catch (error) {
		console.error("Error getting git log:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to get git log",
			null,
			"git log",
			"unknown",
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});
