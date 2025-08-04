import { z } from "@hono/zod-openapi";

export const GitBranchSchema = z.object({
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
	commitHash: z.string().optional().openapi({
		example: "a1b2c3d",
		description: "Short commit hash",
	}),
	commitMessage: z.string().optional().openapi({
		example: "Add new feature",
		description: "Commit message (truncated)",
	}),
	trackingStatus: z.string().optional().openapi({
		example: "gone",
		description: "Tracking status (gone, up to date, etc.)",
	}),
});

export const GitStatusSchema = z.object({
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

export const GitInfoSchema = z.object({
	success: z.boolean().openapi({
		example: true,
		description: "Whether the operation was successful",
	}),
	data: GitStatusSchema.openapi({
		description: "Git repository information",
	}),
});

export const GitCheckoutSchema = z.object({
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

export const GitLogEntrySchema = z.object({
	hash: z.string().openapi({
		example: "a1b2c3d",
		description: "Commit hash (short)",
	}),
	message: z.string().openapi({
		example: "Add new feature",
		description: "Commit message",
	}),
	author: z.string().openapi({
		example: "John Doe",
		description: "Commit author",
	}),
	date: z.string().openapi({
		example: "2024-01-01T12:00:00Z",
		description: "Commit date in ISO format",
	}),
	relative: z.string().openapi({
		example: "2 hours ago",
		description: "Relative time from now",
	}),
});

export const GitLogSchema = z.object({
	success: z.boolean().openapi({
		example: true,
		description: "Whether the operation was successful",
	}),
	data: z
		.object({
			branch: z.string().openapi({
				example: "main",
				description: "Branch name",
			}),
			commits: z.array(GitLogEntrySchema).openapi({
				description: "List of recent commits",
			}),
		})
		.openapi({
			description: "Git log information for a branch",
		}),
});

export type GitBranch = z.infer<typeof GitBranchSchema>;
export type GitStatus = z.infer<typeof GitStatusSchema>;
export type GitInfo = z.infer<typeof GitInfoSchema>;
export type GitCheckout = z.infer<typeof GitCheckoutSchema>;
export type GitLogEntry = z.infer<typeof GitLogEntrySchema>;
export type GitLog = z.infer<typeof GitLogSchema>;
