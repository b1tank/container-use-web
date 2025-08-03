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

export type GitBranch = z.infer<typeof GitBranchSchema>;
export type GitStatus = z.infer<typeof GitStatusSchema>;
export type GitInfo = z.infer<typeof GitInfoSchema>;
export type GitCheckout = z.infer<typeof GitCheckoutSchema>;
