import { createRoute, z } from "@hono/zod-openapi";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as os from "node:os";
import { spawn } from "node:child_process";
import { parseEnvironmentList } from "../utils/parser.js";
import { CLI_COMMANDS, DEFAULT_CLI_PATH } from "../utils/constants.js";
import { EnvironmentListSchema, ErrorSchema } from "../models/environment.js";

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

  try {
    const result = await new Promise<{ code: number; stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn(cliPath, [CLI_COMMANDS.LIST], {
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code: code || 0, stdout, stderr });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });

    if (result.code !== 0) {
      console.error("CLI command failed:", result.stderr);
      return c.json({
        error: "Failed to fetch environments",
        details: {
          exitCode: result.code,
          stderr: result.stderr,
          command: `${cliPath} ${CLI_COMMANDS.LIST}`,
          cwd: workingDir,
        },
      }, 500);
    }

    const environmentList = parseEnvironmentList(result.stdout);
    return c.json(environmentList, 200);
  } catch (error) {
    console.error("CLI command failed:", error);
    return c.json({
      error: "Failed to fetch environments",
      details: {
        exitCode: -1,
        stderr: error instanceof Error ? error.message : 'Unknown error',
        command: `${cliPath} ${CLI_COMMANDS.LIST}`,
        cwd: workingDir,
      },
    }, 500);
  }
});

export type AppType = typeof environments;
