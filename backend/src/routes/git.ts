import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ErrorSchema } from "../models/environment.js";
import {
	createCLIErrorResponse,
	executeGenericCommand,
} from "../utils/cli-executor.js";

// Git schemas
const GitBranchSchema = z.object({
	name: z.string().openapi({
		example: "main",
		description: "Branch name",
	}),
	current: z.boolean().openapi({
		example: true,
		description: "Whether this is the current branch",
	}),
	remote: z.boolean().openapi({
		example: false,
		description: "Whether this is a remote branch",
	}),
	upstream: z.string().optional().openapi({
		example: "origin/main",
		description: "Upstream branch name",
	}),
	ahead: z.number().optional().openapi({
		example: 2,
		description: "Number of commits ahead of upstream",
	}),
	behind: z.number().optional().openapi({
		example: 0,
		description: "Number of commits behind upstream",
	}),
});

const GitStatusSchema = z.object({
	currentBranch: z.string().openapi({
		example: "main",
		description: "Current branch name",
	}),
	isRepository: z.boolean().openapi({
		example: true,
		description: "Whether the folder is a git repository",
	}),
	hasUncommittedChanges: z.boolean().openapi({
		example: false,
		description: "Whether there are uncommitted changes",
	}),
	branches: z.array(GitBranchSchema).openapi({
		description: "List of all branches",
	}),
});

const GitInfoResponseSchema = z.object({
	success: z.boolean().openapi({
		example: true,
		description: "Whether the operation was successful",
	}),
	data: GitStatusSchema.openapi({
		description: "Git repository information",
	}),
});

const GitCheckoutResponseSchema = z.object({
	success: z.boolean().openapi({
		example: true,
		description: "Whether the checkout was successful",
	}),
	message: z.string().openapi({
		example: "Successfully checked out branch: main",
		description: "Success or error message",
	}),
	data: GitStatusSchema.optional().openapi({
		description: "Updated git repository information",
	}),
});

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
					schema: GitInfoResponseSchema,
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
					schema: GitCheckoutResponseSchema,
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

export const git = new OpenAPIHono();

// Types for internal use
interface GitBranch {
	name: string;
	current: boolean;
	remote: boolean;
	upstream?: string;
	ahead?: number;
	behind?: number;
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
 * Get all branches (local and remote)
 */
async function getAllBranches(folder: string): Promise<GitBranch[]> {
	try {
		// Get local branches
		const localResult = await executeGenericCommand({
			command: "git",
			args: ["branch", "-v"],
			workingDir: folder,
		});

		// Get remote branches
		const remoteResult = await executeGenericCommand({
			command: "git",
			args: ["branch", "-rv"],
			workingDir: folder,
		});

		const branches: GitBranch[] = [];

		// Parse local branches
		if (localResult.code === 0) {
			const lines = localResult.stdout
				.split("\n")
				.filter((line: string) => line.trim());
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;

				const isCurrent = trimmed.startsWith("*");
				const branchInfo = isCurrent ? trimmed.substring(1).trim() : trimmed;
				const parts = branchInfo.split(/\s+/);

				if (parts.length >= 1) {
					const name = parts[0];
					branches.push({
						name,
						current: isCurrent,
						remote: false,
					});
				}
			}
		}

		// Parse remote branches
		if (remoteResult.code === 0) {
			const lines = remoteResult.stdout
				.split("\n")
				.filter((line: string) => line.trim());
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.includes("->")) continue; // Skip HEAD references

				const parts = trimmed.split(/\s+/);
				if (parts.length >= 1) {
					const fullName = parts[0];
					// Extract just the branch name from origin/branch-name
					const branchName = fullName.includes("/")
						? fullName.split("/").slice(1).join("/")
						: fullName;

					// Only add if we don't already have this branch locally
					if (!branches.some((b) => b.name === branchName && !b.remote)) {
						branches.push({
							name: branchName,
							current: false,
							remote: true,
							upstream: fullName,
						});
					}
				}
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
		const result = await executeGenericCommand({
			command: "git",
			args: ["checkout", branch],
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
