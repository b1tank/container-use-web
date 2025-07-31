import * as os from "node:os";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	EnvironmentDiffSchema,
	EnvironmentListSchema,
	EnvironmentLogsSchema,
	ErrorSchema,
} from "../models/environment.js";
import {
	createCLIErrorResponse,
	executeCLICommand,
} from "../utils/cli-executor.js";
import { CLI_COMMANDS, DEFAULT_CLI_PATH } from "../utils/constants.js";
import { parseEnvironmentList } from "../utils/parser.js";

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
					description: "Working directory for the CLI command",
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
					schema: EnvironmentListSchema,
				},
			},
			description: "List of environments",
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
					description: "Working directory for the CLI command",
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
					description: "Working directory for the CLI command",
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

export const environments = new OpenAPIHono();

// Mount the environment list route
environments.openapi(environmentListRoute, async (c) => {
	const { folder, cli } = c.req.valid("query");

	// Get the folder parameter from query string, default to home directory
	const workingDir = folder || os.homedir();
	// Get the CLI command path from query string, default to constant
	const cliPath = cli || DEFAULT_CLI_PATH;

	try {
		const result = await executeCLICommand({
			command: CLI_COMMANDS.LIST,
			workingDir,
			cliPath,
		});

		if (result.code !== 0) {
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
		return c.json(environmentList, 200);
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

	// Get the folder parameter from query string, default to home directory
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

	// Get the folder parameter from query string, default to home directory
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

export type AppType = typeof environments;
