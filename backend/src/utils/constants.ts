/**
 * Application constants and configuration values
 */

// Default CLI configuration
export const DEFAULT_CLI_PATH = "/Users/b1tank/container-use/container-use";

// Default command arguments
export const CLI_COMMANDS = {
	LIST: "list",
	LOG: "log",
	DIFF: "diff",
	WATCH: "watch",
	TERMINAL: "terminal",
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
	DEFAULT_FOLDER: null, // Will use os.homedir() when null
} as const;
