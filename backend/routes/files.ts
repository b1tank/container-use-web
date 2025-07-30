import { createRoute, z } from "npm:@hono/zod-openapi";
import { OpenAPIHono } from "npm:@hono/zod-openapi";
import * as path from "node:path";
import * as os from "node:os";
import { DirectoryListingSchema } from "../models/filesystem.ts";
import { ErrorSchema } from "../models/environment.ts";

// Route to list directory contents
export const directoryListRoute = createRoute({
  method: "get",
  path: "/files",
  request: {
    query: z.object({
      path: z.string().optional().openapi({
        param: {
          name: "path",
          in: "query",
        },
        example: "/Users/b1tank/hello",
        description: "Directory path to list. Defaults to home directory if not provided",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: DirectoryListingSchema,
        },
      },
      description: "Directory listing",
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

export const files = new OpenAPIHono();

// Mount the directory list route
files.openapi(directoryListRoute, async (c) => {
  try {
    const { path: requestedPath } = c.req.valid("query");
    const targetPath = requestedPath || os.homedir();

    // Resolve and normalize the path
    const resolvedPath = path.resolve(targetPath);

    // Check if path exists and is a directory
    const stats = await Deno.stat(resolvedPath);
    if (!stats.isDirectory) {
      return c.json({
        error: "Path is not a directory",
        details: {
          exitCode: 1,
          stderr: `Path ${resolvedPath} is not a directory`,
          command: "fs:stat",
          cwd: resolvedPath,
        }
      }, 500);
    }

    // Read directory contents
    const items: Array<{
      name: string;
      path: string;
      type: "file" | "directory";
      size?: number;
      modified?: string;
    }> = [];

    for await (const entry of Deno.readDir(resolvedPath)) {
      const entryPath = path.join(resolvedPath, entry.name);
      try {
        const entryStats = await Deno.stat(entryPath);
        items.push({
          name: entry.name,
          path: entryPath,
          type: entryStats.isDirectory ? "directory" : "file",
          size: entryStats.isFile ? entryStats.size : undefined,
          modified: entryStats.mtime?.toISOString(),
        });
      } catch {
        // Skip items we can't stat
      }
    }

    // Sort items: directories first, then files, both alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const parent = path.dirname(resolvedPath);
    const response = {
      path: resolvedPath,
      items,
      parent: parent === resolvedPath ? null : parent
    };

    return c.json(response, 200);
  } catch (err) {
    console.error("Directory listing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return c.json({
      error: "Directory not found or access denied",
      details: {
        exitCode: 1,
        stderr: errorMessage,
        command: "fs:readdir",
        cwd: "unknown",
      }
    }, 500);
  }
});
