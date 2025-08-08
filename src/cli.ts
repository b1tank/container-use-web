import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
const packageJsonPath = join(__dirname, "..", "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const program = new Command();

/**
 * Resolves a directory path, handling special cases like '.' and '~'
 */
function resolveDirectory(dir: string): string {
	if (dir === ".") {
		return process.cwd();
	}
	if (dir.startsWith("~/")) {
		return join(homedir(), dir.slice(2));
	}
	if (dir === "~") {
		return homedir();
	}
	return resolve(dir);
}

program
	.name("cuweb")
	.description(
		"Container Use Web: Runs a local web UI for monitoring and managing Container Use environments.",
	)
	.version(version)
	.helpOption("-H, --help", "Display help for command")
	.option("-h, --host <HOST>", "Host to listen on", "localhost")
	.option("-p, --port <PORT>", "Port to listen on", "8000")
	.option("-d, --dir 	<DIR>", "Working directory", ".")
	.option(
		"-b, --bin  <BINARY>",
		"Path to the container-use binary",
		"container-use",
	)
	.option("-n, --no-open", "Do not open the browser automatically")
	.action(async (options) => {
		const { host, port, dir, bin, open: shouldOpen } = options;

		// Resolve the working directory
		const workingDir = resolveDirectory(dir);

		console.log(`🚀 Starting Container Use Web on http://${host}:${port}`);
		console.log(`📁 Working directory: ${workingDir}`);
		console.log(`🔧 Container-use binary: ${bin}`);

		// Start the backend server
		const backendPath = join(__dirname, "..", "backend", "dist", "index.js");
		// Resolve the absolute path to the frontend/dist directory
		const frontendDist = resolve(join(__dirname, "..", "frontend", "dist"));
		const serverProcess = spawn("node", [backendPath], {
			stdio: "inherit",
			env: {
				...process.env,
				PORT: port,
				HOST: host,
				CUWEB_WORKING_DIR: workingDir,
				CUWEB_CLI_BINARY: bin,
				CUWEB_FRONTEND_DIST: frontendDist,
			},
		});

		// Handle graceful shutdown
		const cleanup = () => {
			console.log("\n🛑 Shutting down Container Use Web...");
			serverProcess.kill("SIGTERM");
			process.exit(0);
		};

		process.on("SIGINT", cleanup);
		process.on("SIGTERM", cleanup);

		// Handle browser opening
		if (!shouldOpen) {
			console.log(
				`ℹ️  Browser auto-open disabled. Visit http://${host}:${port}?folder=${encodeURIComponent(workingDir)}&cli=${encodeURIComponent(bin)}`,
			);
		} else {
			// Open browser after a short delay - automatically open to working directory
			setTimeout(async () => {
				try {
					const url = `http://${host}:${port}?folder=${encodeURIComponent(workingDir)}&cli=${encodeURIComponent(bin)}`;
					await open(url);
					console.log(`🌐 Opened browser at ${url}`);
				} catch {
					const url = `http://${host}:${port}?folder=${encodeURIComponent(workingDir)}&cli=${encodeURIComponent(bin)}`;
					console.log(
						`ℹ️  Browser could not be opened automatically. Please visit ${url}`,
					);
				}
			}, 2000);
		}

		serverProcess.on("exit", (code) => {
			if (code !== 0) {
				console.error(`❌ Server exited with code ${code}`);
				process.exit(code || 1);
			}
		});
	});

program.parse();
