import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { ErrorSchema } from "../models/environment.js";
import { FolderListingSchema } from "../models/filesystem.js";

// Route to list folder contents
export const folderListRoute = createRoute({
	method: "get",
	path: "/files",
	request: {
		query: z.object({
			path: z
				.string()
				.optional()
				.openapi({
					param: {
						name: "path",
						in: "query",
					},
					example: "/Users/b1tank/hello",
					description:
						"Folder path to list. Defaults to home folder if not provided",
				}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: FolderListingSchema,
				},
			},
			description: "Folder listing",
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

// Mount the folder list route
files.openapi(folderListRoute, async (c) => {
	try {
		const { path: requestedPath } = c.req.valid("query");
		const targetPath = requestedPath || os.homedir();

		// Resolve and normalize the path
		const resolvedPath = path.resolve(targetPath);

		// Check if path exists and is a folder
		const stats = await fs.stat(resolvedPath);
		if (!stats.isDirectory()) {
			return c.json(
				{
					error: "Path is not a folder",
					details: {
						exitCode: 1,
						stderr: `Path ${resolvedPath} is not a folder`,
						command: "fs:stat",
						cwd: resolvedPath,
					},
				},
				500,
			);
		}

		// Read folder contents
		const items: Array<{
			name: string;
			path: string;
			type: "file" | "folder";
			size?: number;
			modified?: string;
		}> = [];

		const entries = await fs.readdir(resolvedPath);
		for (const entryName of entries) {
			const entryPath = path.join(resolvedPath, entryName);
			try {
				const entryStats = await fs.stat(entryPath);
				items.push({
					name: entryName,
					path: entryPath,
					type: entryStats.isDirectory() ? "folder" : "file",
					size: entryStats.isFile() ? entryStats.size : undefined,
					modified: entryStats.mtime?.toISOString(),
				});
			} catch {
				// Skip items we can't stat
			}
		}

		// Sort items: directories first, then files, both alphabetically
		items.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === "folder" ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});

		const parent = path.dirname(resolvedPath);
		const response = {
			path: resolvedPath,
			items,
			parent: parent === resolvedPath ? null : parent,
		};

		return c.json(response, 200);
	} catch (err) {
		console.error("Folder listing error:", err);
		const errorMessage = err instanceof Error ? err.message : "Unknown error";
		return c.json(
			{
				error: "Folder not found or access denied",
				details: {
					exitCode: 1,
					stderr: errorMessage,
					command: "fs:readdir",
					cwd: "unknown",
				},
			},
			500,
		);
	}
});
