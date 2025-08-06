import { spawn } from "node:child_process";
import { getDefaultCLIPath } from "./constants.js";

export interface CLIExecutionOptions {
	command: string;
	args?: string[];
	workingDir?: string;
	cliPath?: string;
	environment?: Record<string, string>;
	forceColor?: boolean;
}

export interface GenericCommandOptions {
	command: string;
	args?: string[];
	workingDir?: string;
	environment?: Record<string, string>;
	forceColor?: boolean;
}

export interface CLIExecutionResult {
	code: number;
	stdout: string;
	stderr: string;
}

export interface CLIErrorResponse {
	error: string;
	details: {
		exitCode: number;
		stderr: string;
		command: string;
		cwd: string;
	};
}

/**
 * Executes a CLI command and returns the result
 * Handles common error cases and provides consistent error formatting
 */
export async function executeCLICommand(
	options: CLIExecutionOptions,
): Promise<CLIExecutionResult> {
	const {
		command,
		args = [],
		workingDir = process.cwd(),
		cliPath = getDefaultCLIPath(),
		environment = {},
		forceColor = true,
	} = options;

	return new Promise<CLIExecutionResult>((resolve, reject) => {
		const child = spawn(cliPath, [command, ...args], {
			cwd: workingDir,
			stdio: ["pipe", "pipe", "pipe"],
			env: {
				...process.env,
				...environment,
				// Force colored output for terminal commands
				...(forceColor && {
					FORCE_COLOR: "1",
					CLICOLOR_FORCE: "1",
					NO_COLOR: undefined,
					TERM: "xterm-256color", // Ensure proper terminal type
				}),
			},
		});

		let stdout = "";
		let stderr = "";

		child.stdout?.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr?.on("data", (data) => {
			stderr += data.toString();
		});

		child.on("close", (code) => {
			resolve({ code: code || 0, stdout, stderr });
		});

		child.on("error", (error) => {
			reject(error);
		});
	});
}

/**
 * Executes any generic command (e.g., git, npm, etc.) directly
 * This is useful for system commands that aren't part of the container-use CLI
 */
export async function executeGenericCommand(
	options: GenericCommandOptions,
): Promise<CLIExecutionResult> {
	const {
		command,
		args = [],
		workingDir = process.cwd(),
		environment = {},
		forceColor = true,
	} = options;

	return new Promise<CLIExecutionResult>((resolve, reject) => {
		const child = spawn(command, args, {
			cwd: workingDir,
			stdio: ["pipe", "pipe", "pipe"],
			env: {
				...process.env,
				...environment,
				// Force colored output for terminal commands
				...(forceColor && {
					FORCE_COLOR: "1",
					CLICOLOR_FORCE: "1",
					NO_COLOR: undefined,
					TERM: "xterm-256color", // Ensure proper terminal type
				}),
			},
		});

		let stdout = "";
		let stderr = "";

		child.stdout?.on("data", (data) => {
			stdout += data.toString();
		});

		child.stderr?.on("data", (data) => {
			stderr += data.toString();
		});

		child.on("close", (code) => {
			resolve({ code: code || 0, stdout, stderr });
		});

		child.on("error", (error) => {
			reject(error);
		});
	});
}

/**
 * Creates a standardized error response for CLI command failures
 */
export function createCLIErrorResponse(
	errorMessage: string,
	result: CLIExecutionResult | null,
	command: string,
	cwd: string,
	error?: Error,
): CLIErrorResponse {
	return {
		error: errorMessage,
		details: {
			exitCode: result?.code ?? -1,
			stderr: result?.stderr ?? (error?.message || "Unknown error"),
			command,
			cwd,
		},
	};
}
