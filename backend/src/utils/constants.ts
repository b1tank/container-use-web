/**
 * Application constants and configuration values
 */

// Default CLI configuration
export const DEFAULT_CLI_PATH = "container-use";

// Default command arguments
export const CLI_COMMANDS = {
	LIST: "list",
	LOG: "log",
	DIFF: "diff",
	WATCH: "watch",
	TERMINAL: "terminal",
	FILE_WATCH: "file-watch",
	APPLY: "apply",
	MERGE: "merge",
	CHECKOUT: "checkout",
} as const;

// CLI command type
export type CLICommand = (typeof CLI_COMMANDS)[keyof typeof CLI_COMMANDS];

// Query parameter names
export const QUERY_PARAMS = {
	FOLDER: "folder",
	CLI: "cli",
} as const;

// API configuration
export const API_CONFIG = {
	DEFAULT_FOLDER: null, // Will use process.cwd() when null
} as const;

/**
 * Get default working directory from environment variable or current working directory
 */
export function getDefaultWorkingDir(): string {
	return process.env.CUWEB_WORKING_DIR || process.cwd();
}

/**
 * Get default CLI binary path from environment variable or default
 */
export function getDefaultCLIPath(): string {
	return process.env.CUWEB_CLI_BINARY || DEFAULT_CLI_PATH;
}
