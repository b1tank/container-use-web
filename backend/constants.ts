/**
 * Application constants and configuration values
 */

// Default CLI configuration
export const DEFAULT_CLI_PATH = "/Users/b1tank/container-use/container-use";

// Default command arguments
export const CLI_COMMANDS = {
  LIST: "list",
} as const;

// Query parameter names
export const QUERY_PARAMS = {
  FOLDER: "folder",
  CLI: "cli",
} as const;

// API configuration
export const API_CONFIG = {
  DEFAULT_FOLDER: null, // Will use os.homedir() when null
} as const;
