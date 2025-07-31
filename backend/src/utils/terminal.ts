import { homedir } from "node:os";
import process from "node:process";
import * as pty from "node-pty";
import { CLI_COMMANDS, type CLICommand } from "./constants.js";

interface TerminalOptions {
	command?: CLICommand;
	environmentId?: string;
	workingDir?: string;
	cliPath?: string;
}

const getOSShell = (): string => {
	return process.platform === "win32" ? "powershell.exe" : "bash";
};

const getShellArgs = (): string[] => {
	// Use login shell to load user's profile (.bash_profile, .bashrc, etc.)
	return process.platform === "win32" ? [] : ["-l"];
};

const getEnhancedEnv = () => {
	const enhancedEnv = { ...process.env };

	// Ensure color support
	enhancedEnv.TERM = "xterm-256color";
	enhancedEnv.FORCE_COLOR = "1";
	enhancedEnv.CLICOLOR = "1";
	enhancedEnv.COLORTERM = "truecolor";

	// Set HOME if not already set (important for loading user's profile)
	if (!enhancedEnv.HOME && process.platform !== "win32") {
		enhancedEnv.HOME = homedir();
	}

	// Ensure PATH includes common locations
	if (!enhancedEnv.PATH?.includes("/usr/local/bin")) {
		enhancedEnv.PATH = `/usr/local/bin:${enhancedEnv.PATH || "/usr/bin:/bin"}`;
	}

	return enhancedEnv;
};

/**
 * Unified terminal handler that supports different CLI commands
 *
 * Examples:
 * - Plain terminal: handleTerminal(ws)
 * - Environment terminal: handleTerminal(ws, { command: CLI_COMMANDS.TERMINAL, environmentId: "my-env", workingDir: "/path", cliPath: "/usr/bin/container-use" })
 * - Watch terminal: handleTerminal(ws, { command: CLI_COMMANDS.WATCH, workingDir: "/path", cliPath: "/usr/bin/container-use" })
 * - Any CLI command: handleTerminal(ws, { command: CLI_COMMANDS.LIST, workingDir: "/path", cliPath: "/usr/bin/container-use" })
 */
export const handleTerminal = (
	ws: WebSocket,
	options: TerminalOptions = {},
): void => {
	const { command, environmentId, workingDir, cliPath } = options;

	// Create a pseudo-terminal shell
	const shell = getOSShell();
	const args = getShellArgs();
	const env = getEnhancedEnv();

	const ptyShell = pty.spawn(shell, args, {
		name: "xterm-256color",
		cwd: workingDir || process.cwd(),
		env,
		encoding: "utf-8",
		cols: 80,
		rows: 30,
	});

	// Set up event listeners for the pseudo-terminal
	// Data flow: shell+pty -> WebSocket -> client
	ptyShell.onData((data: string) => {
		ws.send(data);
	});

	// Handle terminal exit based on command type
	ptyShell.onExit((exitCode) => {
		if (!command) {
			// Plain terminal - just send exit code
			ws.send(exitCode.toString());
		} else {
			// Command-based terminal - send formatted exit message
			const commandName =
				command === CLI_COMMANDS.TERMINAL
					? "Terminal"
					: command.charAt(0).toUpperCase() + command.slice(1);
			ws.send(
				`\r\n\x1b[31m${commandName} session ended with exit code: ${exitCode}\x1b[0m\r\n`,
			);
		}
	});

	// Set up event listener for WebSocket messages
	// Data flow: client -> WebSocket -> pty+shell
	ws.addEventListener("message", (event: MessageEvent) => {
		ptyShell.write(event.data);
	});

	// Set up WebSocket close event handler
	ws.addEventListener("close", () => {
		ptyShell.kill();
	});

	// Bootstrap based on command type
	if (command && cliPath) {
		switch (command) {
			case CLI_COMMANDS.TERMINAL:
				if (environmentId) {
					ptyShell.write(
						`\x1b[32mConnected to environment: ${environmentId}\x1b[0m\r\n`,
					);
					ptyShell.write(
						`\x1b[36mWorking directory: ${workingDir || process.cwd()}\x1b[0m\r\n`,
					);
					ptyShell.write(
						`\x1b[33mStarting container-use terminal...\x1b[0m\r\n`,
					);
					ptyShell.write(`${cliPath} terminal ${environmentId}\r\n`);
				}
				break;
			case CLI_COMMANDS.WATCH:
				ptyShell.write(
					`\x1b[32mStarting watch mode for all environments\x1b[0m\r\n`,
				);
				ptyShell.write(
					`\x1b[36mWorking directory: ${workingDir || process.cwd()}\x1b[0m\r\n`,
				);
				ptyShell.write(
					`\x1b[33mInitializing container-use watch...\x1b[0m\r\n`,
				);
				ptyShell.write(`${cliPath} watch\r\n`);
				break;
			default:
				// For other commands (LIST, LOG, DIFF), just run the command
				ptyShell.write(
					`\x1b[33mExecuting container-use ${command}...\x1b[0m\r\n`,
				);
				if (environmentId) {
					ptyShell.write(`${cliPath} ${command} ${environmentId}\r\n`);
				} else {
					ptyShell.write(`${cliPath} ${command}\r\n`);
				}
				break;
		}
	}
};
