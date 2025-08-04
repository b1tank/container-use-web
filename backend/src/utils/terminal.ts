import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import process from "node:process";
import chokidar, { type FSWatcher } from "chokidar";
import * as pty from "node-pty";
import { CLI_COMMANDS, type CLICommand } from "./constants.js";

interface TerminalOptions {
	command?: CLICommand;
	environmentId?: string;
	workingDir?: string;
	cliPath?: string;
	filePath?: string; // For file watching
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
		cols: 120,
		rows: 30,
		handleFlowControl: false, // Disable flow control to prevent blocking
		useConpty: false, // Use legacy mode for better compatibility
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
		// Check if this is a resize message (JSON format from frontend)
		if (typeof event.data === "string" && event.data.startsWith("{")) {
			try {
				const message = JSON.parse(event.data);
				if (message.type === "resize" && message.cols && message.rows) {
					ptyShell.resize(message.cols, message.rows);
					return;
				}
			} catch {
				// Not a valid JSON message, treat as terminal input
			}
		}
		ptyShell.write(event.data);
	});

	// Set up WebSocket close event handler
	ws.addEventListener("close", () => {
		ptyShell.kill();
	});

	// Bootstrap based on command type
	if (command && cliPath) {
		// Give the shell a moment to initialize properly
		setTimeout(() => {
			switch (command) {
				case CLI_COMMANDS.TERMINAL:
					if (environmentId) {
						// Clear any existing prompt and execute the command
						ptyShell.write("\u0003"); // Send Ctrl+C to clear any running command
						setTimeout(() => {
							ptyShell.write(`clear\r`); // Clear the screen with just CR
							setTimeout(() => {
								ptyShell.write(`${cliPath} terminal ${environmentId}\r`);
							}, 50);
						}, 50);
					}
					break;
				case CLI_COMMANDS.WATCH:
					// Clear any existing prompt and execute the command
					ptyShell.write("\u0003"); // Send Ctrl+C to clear any running command
					setTimeout(() => {
						ptyShell.write(`clear\r`); // Clear the screen with just CR
						setTimeout(() => {
							ptyShell.write(`${cliPath} watch\r`);
						}, 50);
					}, 50);
					break;
				default:
					// For other commands (LIST, LOG, DIFF), just run the command
					ptyShell.write("\u0003"); // Send Ctrl+C to clear any running command
					setTimeout(() => {
						ptyShell.write(`clear\r`); // Clear the screen with just CR
						setTimeout(() => {
							if (environmentId) {
								ptyShell.write(`${cliPath} ${command} ${environmentId}\r`);
							} else {
								ptyShell.write(`${cliPath} ${command}\r`);
							}
						}, 50);
					}, 50);
					break;
			}
		}, 200); // Increased delay to let shell initialize
	}
};

/**
 * File watching handler that streams file content changes in real-time
 *
 * @param ws WebSocket connection from @hono/node-ws
 * @param filePath Absolute path to the file to watch
 */
export const handleFileWatch = (ws: WebSocket, filePath: string): void => {
	let watcher: FSWatcher | null = null;

	const sendFileContent = async () => {
		try {
			const content = await readFile(filePath, "utf-8");
			ws.send(
				JSON.stringify({
					type: "content",
					filePath,
					content,
					timestamp: new Date().toISOString(),
				}),
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "error",
					filePath,
					error: error instanceof Error ? error.message : "Unknown error",
					timestamp: new Date().toISOString(),
				}),
			);
		}
	};

	// Send initial content
	sendFileContent();

	// Set up file watcher
	watcher = chokidar.watch(filePath, {
		persistent: true,
		ignoreInitial: true, // Don't emit events for initial scan
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50,
		},
	});

	// Watch for file changes
	watcher.on("change", () => {
		sendFileContent();
	});

	// Handle file deletion
	watcher.on("unlink", () => {
		ws.send(
			JSON.stringify({
				type: "deleted",
				filePath,
				timestamp: new Date().toISOString(),
			}),
		);
	});

	// Handle errors
	watcher.on("error", (error: unknown) => {
		ws.send(
			JSON.stringify({
				type: "error",
				filePath,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			}),
		);
	});

	// Clean up when WebSocket closes
	ws.addEventListener("close", () => {
		if (watcher) {
			watcher.close();
			watcher = null;
		}
	});

	// Handle WebSocket errors
	ws.addEventListener("error", () => {
		if (watcher) {
			watcher.close();
			watcher = null;
		}
	});
};
