import { createRoute, z } from "npm:@hono/zod-openapi";
import { OpenAPIHono } from "npm:@hono/zod-openapi";
import * as os from "node:os";
import { parseEnvironmentList } from "../utils/parser.ts";
import { CLI_COMMANDS, DEFAULT_CLI_PATH } from "../constants.ts";
import { EnvironmentListSchema, ErrorSchema } from "../models/environment.ts";

// Route to list all environments
export const environmentListRoute = createRoute({
  method: "get",
  path: "/environments",
  request: {
    query: z.object({
      folder: z.string().optional().openapi({
        param: {
          name: "folder",
          in: "query",
        },
        example: "/Users/b1tank/hello",
        description: "Working directory for the CLI command",
      }),
      cli: z.string().optional().openapi({
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

export const environments = new OpenAPIHono();

// Mount the environment list route
environments.openapi(environmentListRoute, async (c) => {
  const { folder, cli } = c.req.valid("query");

  // Get the folder parameter from query string, default to home directory
  const workingDir = folder || os.homedir();
  // Get the CLI command path from query string, default to constant
  const cliPath = cli || DEFAULT_CLI_PATH;

  const command = new Deno.Command(cliPath, {
    args: [CLI_COMMANDS.LIST],
    stdout: "piped",
    stderr: "piped",
    cwd: workingDir,
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    console.error("CLI command failed:", errorText);
    return c.json({
      error: "Failed to fetch environments",
      details: {
        exitCode: code,
        stderr: errorText,
        command: `${cliPath} ${CLI_COMMANDS.LIST}`,
        cwd: workingDir,
      },
    }, 500);
  }

  const output = new TextDecoder().decode(stdout);
  const environmentList = parseEnvironmentList(output);

  return c.json(environmentList, 200);
});

export type AppType = typeof environments;
