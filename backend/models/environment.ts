import { z } from "npm:@hono/zod-openapi";

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

export const EnvironmentListSchema = z.array(EnvironmentSchema).openapi(
  "EnvironmentList",
);

export const ErrorSchema = z.object({
  error: z.string().openapi({
    example: "Failed to fetch environments",
  }),
  details: z.object({
    exitCode: z.number(),
    stderr: z.string(),
    command: z.string(),
    cwd: z.string(),
  }).optional(),
}).openapi("Error");

export type Environment = z.infer<typeof EnvironmentSchema>;
