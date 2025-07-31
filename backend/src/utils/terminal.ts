import process from "node:process";
import * as pty from "node-pty";
import { homedir } from "node:os";

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

export const handleOpenTerminal = (ws: WebSocket): void => {
	// Create a pseudo-terminal shell
	const shell = getOSShell();
	const args = getShellArgs();
	const env = getEnhancedEnv();

	const ptyShell = pty.spawn(shell, args, {
		name: "xterm-256color",
		cwd: process.cwd(),
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

	// Handle terminal exit
	ptyShell.onExit((exitCode) => {
		ws.send(exitCode.toString());
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
};
