import { z } from "@hono/zod-openapi";

/**
 * File system entry schema (simplified for directory browsing)
 */
export const FileEntrySchema = z.object({
  name: z.string().openapi({
    description: "Name of the file or directory",
    example: "main.go"
  }),
  path: z.string().openapi({
    description: "Full path to the file or directory",
    example: "/Users/b1tank/hello/README.md"
  }),
  type: z.enum(["file", "directory"]).openapi({
    description: "Type of the entry",
    example: "file"
  }),
  size: z.number().optional().openapi({
    description: "Size of the file in bytes (only for files)",
    example: 1024
  }),
  modified: z.string().optional().openapi({
    description: "Last modified timestamp",
    example: "2023-01-01T00:00:00Z"
  })
});

/**
 * Directory listing response
 */
export const DirectoryListingSchema = z.object({
  path: z.string().openapi({
    description: "Current directory path",
    example: "/Users/b1tank/hello"
  }),
  items: z.array(FileEntrySchema).openapi({
    description: "List of files and directories in the current path"
  }),
  parent: z.string().nullable().openapi({
    description: "Parent directory path, null if at root",
    example: "/Users/john"
  })
});

/**
 * TypeScript types for file system operations
 */
export type FileEntry = z.infer<typeof FileEntrySchema>;
export type DirectoryListing = z.infer<typeof DirectoryListingSchema>;
