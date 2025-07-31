import { z } from "@hono/zod-openapi";

export const ParamsSchema = z.object({
	id: z
		.string()
		.min(3)
		.openapi({
			param: {
				name: "id",
				in: "path",
			},
			example: "sharing-loon",
		}),
});

export const EnvironmentSchema = z
	.object({
		id: z.string().openapi({
			example: "sharing-loon",
		}),
		title: z.string().openapi({
			example: "Flask Hello World App",
		}),
		created: z.string().openapi({
			example: "1 month ago",
		}),
		updated: z.string().openapi({
			example: "1 week ago",
		}),
	})
	.openapi("Environment");

export const EnvironmentListSchema = z
	.array(EnvironmentSchema)
	.openapi("EnvironmentList");

export const EnvironmentLogsSchema = z
	.object({
		environmentId: z.string().openapi({
			example: "sharing-loon",
		}),
		logs: z.string().openapi({
			example:
				"8a9d3a6  Creating a README file with instructions for running the Flask app (77 seconds ago)\nWrite README.md\n\n$ python app.py &",
		}),
		timestamp: z.string().openapi({
			example: "2025-07-31T10:30:00Z",
		}),
	})
	.openapi("EnvironmentLogs");

export const EnvironmentDiffSchema = z
	.object({
		environmentId: z.string().openapi({
			example: "sharing-loon",
		}),
		diff: z.string().openapi({
			example:
				"diff --git a/README.md b/README.md\nindex e69de29..2a65c16 100644\n--- a/README.md\n+++ b/README.md\n@@ -0,0 +1,27 @@",
		}),
		timestamp: z.string().openapi({
			example: "2025-07-31T10:30:00Z",
		}),
	})
	.openapi("EnvironmentDiff");

export const ErrorSchema = z
	.object({
		error: z.string().openapi({
			example: "Failed to fetch environments",
		}),
		details: z
			.object({
				exitCode: z.number(),
				stderr: z.string(),
				command: z.string(),
				cwd: z.string(),
			})
			.optional(),
	})
	.openapi("Error");

export type Environment = z.infer<typeof EnvironmentSchema>;
export type EnvironmentLogs = z.infer<typeof EnvironmentLogsSchema>;
export type EnvironmentDiff = z.infer<typeof EnvironmentDiffSchema>;
