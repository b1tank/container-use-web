import * as os from "node:os";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	EnvironmentApplySchema,
	EnvironmentCheckoutSchema,
	EnvironmentDiffSchema,
	EnvironmentListResponseSchema,
	EnvironmentLogsSchema,
	EnvironmentMergeSchema,
	ErrorSchema,
} from "../models/environment.js";
import {
	createCLIErrorResponse,
	executeCLICommand,
	executeGenericCommand,
} from "../utils/cli-executor.js";
import { CLI_COMMANDS, DEFAULT_CLI_PATH } from "../utils/constants.js";
import { parseEnvironmentList } from "../utils/parser.js";

// Helper function to get git repository information
async function getGitInfo(workingDir: string) {
	try {
		// Check if we're in a git repository
		const gitRevParseResult = await executeGenericCommand({
			command: "git",
			args: ["rev-parse", "--is-inside-work-tree"],
			workingDir,
		});

		if (gitRevParseResult.code !== 0) {
			return {
				isRepository: false,
				currentBranch: undefined,
			};
		}

		// Get current branch
		const branchResult = await executeGenericCommand({
			command: "git",
			args: ["branch", "--show-current"],
			workingDir,
		});

		return {
			isRepository: true,
			currentBranch:
				branchResult.code === 0 ? branchResult.stdout.trim() : undefined,
		};
	} catch (error) {
		console.warn("Failed to get git info:", error);
		return {
			isRepository: false,
			currentBranch: undefined,
		};
	}
}

// Route to list all environments
export const environmentListRoute = createRoute({
	method: "get",
	path: "/environments",
	request: {
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentListResponseSchema,
				},
			},
			description: "List of environments with git repository information",
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

// Route to get environment logs
export const environmentLogsRoute = createRoute({
	method: "get",
	path: "/environments/{id}/logs",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "sharing-loon",
				description: "Environment ID",
			}),
		}),
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentLogsSchema,
				},
			},
			description: "Environment logs",
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

// Route to get environment diff
export const environmentDiffRoute = createRoute({
	method: "get",
	path: "/environments/{id}/diff",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "sharing-loon",
				description: "Environment ID",
			}),
		}),
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentDiffSchema,
				},
			},
			description: "Environment diff",
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

// Route to apply environment changes
export const environmentApplyRoute = createRoute({
	method: "post",
	path: "/environments/{id}/apply",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "sharing-loon",
				description: "Environment ID",
			}),
		}),
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentApplySchema,
				},
			},
			description: "Environment applied successfully",
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

// Route to merge environment changes
export const environmentMergeRoute = createRoute({
	method: "post",
	path: "/environments/{id}/merge",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "sharing-loon",
				description: "Environment ID",
			}),
		}),
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentMergeSchema,
				},
			},
			description: "Environment merged successfully",
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

// Route to checkout environment
export const environmentCheckoutRoute = createRoute({
	method: "post",
	path: "/environments/{id}/checkout",
	request: {
		params: z.object({
			id: z.string().openapi({
				param: {
					name: "id",
					in: "path",
				},
				example: "sharing-loon",
				description: "Environment ID",
			}),
		}),
		query: z.object({
			folder: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "folder",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description: "Working folder for the CLI command",
				}),
			cli: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "cli",
						in: "query",
					},
					example: "/Users/b1tank/container-use/container-use",
					description: "Path to the container-use CLI",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: EnvironmentCheckoutSchema,
				},
			},
			description: "Environment checked out successfully",
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

export const environments = new OpenAPIHono();

// Mount the environment list route
environments.openapi(environmentListRoute, async (c) => {
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		// Get git repository information
		const gitInfo = await getGitInfo(workingDir);

		const result = await executeCLICommand({
			command: CLI_COMMANDS.LIST,
			workingDir,
			cliPath,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - returning empty environment list",
				);
				return c.json(
					{
						environments: [],
						gitInfo,
					},
					200,
				);
			}
			console.error("CLI command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to fetch environments",
				result,
				`${cliPath} ${CLI_COMMANDS.LIST}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		const environmentList = parseEnvironmentList(result.stdout);
		return c.json(
			{
				environments: environmentList,
				gitInfo,
			},
			200,
		);
	} catch (error) {
		console.error("CLI command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to fetch environments",
			null,
			`${cliPath} ${CLI_COMMANDS.LIST}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the environment logs route
environments.openapi(environmentLogsRoute, async (c) => {
	const { id } = c.req.valid("param");
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.LOG,
			args: [id],
			workingDir,
			cliPath,
			forceColor: true,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - cannot fetch logs for environment:",
					id,
				);
				return c.json(
					{
						environmentId: id,
						logs: "No logs available - not in a git repository",
						timestamp: new Date().toISOString(),
					},
					200,
				);
			}
			console.error("CLI log command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to fetch environment logs",
				result,
				`${cliPath} ${CLI_COMMANDS.LOG}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		return c.json(
			{
				environmentId: id,
				logs: result.stdout,
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		console.error("CLI log command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to fetch environment logs",
			null,
			`${cliPath} ${CLI_COMMANDS.LOG}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the environment diff route
environments.openapi(environmentDiffRoute, async (c) => {
	const { id } = c.req.valid("param");
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.DIFF,
			args: [id],
			workingDir,
			cliPath,
			forceColor: true,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - cannot fetch diff for environment:",
					id,
				);
				return c.json(
					{
						environmentId: id,
						diff: "No diff available - not in a git repository",
						timestamp: new Date().toISOString(),
					},
					200,
				);
			}
			console.error("CLI diff command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to fetch environment diff",
				result,
				`${cliPath} ${CLI_COMMANDS.DIFF}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		return c.json(
			{
				environmentId: id,
				diff: result.stdout,
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		console.error("CLI diff command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to fetch environment diff",
			null,
			`${cliPath} ${CLI_COMMANDS.DIFF}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the environment apply route
environments.openapi(environmentApplyRoute, async (c) => {
	const { id } = c.req.valid("param");
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.APPLY,
			args: [id],
			workingDir,
			cliPath,
			forceColor: true,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - cannot apply environment:",
					id,
				);
				return c.json(
					{
						environmentId: id,
						output: "Cannot apply - not in a git repository",
						success: false,
						timestamp: new Date().toISOString(),
					},
					200,
				);
			}
			console.error("CLI apply command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to apply environment",
				result,
				`${cliPath} ${CLI_COMMANDS.APPLY}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		return c.json(
			{
				environmentId: id,
				output: result.stdout,
				success: true,
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		console.error("CLI apply command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to apply environment",
			null,
			`${cliPath} ${CLI_COMMANDS.APPLY}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the environment merge route
environments.openapi(environmentMergeRoute, async (c) => {
	const { id } = c.req.valid("param");
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.MERGE,
			args: [id],
			workingDir,
			cliPath,
			forceColor: true,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - cannot merge environment:",
					id,
				);
				return c.json(
					{
						environmentId: id,
						output: "Cannot merge - not in a git repository",
						success: false,
						timestamp: new Date().toISOString(),
					},
					200,
				);
			}
			console.error("CLI merge command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to merge environment",
				result,
				`${cliPath} ${CLI_COMMANDS.MERGE}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		return c.json(
			{
				environmentId: id,
				output: result.stdout,
				success: true,
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		console.error("CLI merge command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to merge environment",
			null,
			`${cliPath} ${CLI_COMMANDS.MERGE}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

// Mount the environment checkout route
environments.openapi(environmentCheckoutRoute, async (c) => {
	const { id } = c.req.valid("param");
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home folder
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.CHECKOUT,
			args: [id],
			workingDir,
			cliPath,
			forceColor: true,
		});

		if (result.code !== 0) {
			if (result.stderr.includes("you must be in a git repository")) {
				console.warn(
					"Git repository not found - cannot checkout environment:",
					id,
				);
				return c.json(
					{
						environmentId: id,
						output: "Cannot checkout - not in a git repository",
						success: false,
						timestamp: new Date().toISOString(),
					},
					200,
				);
			}
			console.error("CLI checkout command failed:", result.stderr);
			const errorResponse = createCLIErrorResponse(
				"Failed to checkout environment",
				result,
				`${cliPath} ${CLI_COMMANDS.CHECKOUT}`,
				workingDir,
			);
			return c.json(errorResponse, 500);
		}

		return c.json(
			{
				environmentId: id,
				output: result.stdout,
				success: true,
				timestamp: new Date().toISOString(),
			},
			200,
		);
	} catch (error) {
		console.error("CLI checkout command failed:", error);
		const errorResponse = createCLIErrorResponse(
			"Failed to checkout environment",
			null,
			`${cliPath} ${CLI_COMMANDS.CHECKOUT}`,
			workingDir,
			error instanceof Error ? error : undefined,
		);
		return c.json(errorResponse, 500);
	}
});

export type AppType = typeof environments;
