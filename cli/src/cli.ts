#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import open from "open";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
	.name("container-use-ui")
	.description(
		"A CLI tool for container development with integrated UI dashboard",
	)
	.version("1.0.0");

program
	.command("start")
	.description("Start the Container Use UI server")
	.option("-p, --port <port>", "Port to run the server on", "8000")
	.option("--no-open", "Do not open browser automatically")
	.option("-h, --host <host>", "Host to bind the server to", "localhost")
	.action(async (options) => {
		const { port, open: shouldOpen, host } = options;

		console.log(`🚀 Starting Container Use UI on http://${host}:${port}`);

		// Start the backend server
		const backendPath = join(__dirname, "..", "backend", "dist", "index.js");
		const serverProcess = spawn("node", [backendPath], {
			stdio: "inherit",
			env: {
				...process.env,
				PORT: port,
				HOST: host,
			},
		});

		// Handle graceful shutdown
		const cleanup = () => {
			console.log("\n🛑 Shutting down Container Use UI...");
			serverProcess.kill("SIGTERM");
			process.exit(0);
		};

		process.on("SIGINT", cleanup);
		process.on("SIGTERM", cleanup);

		// Open browser after a short delay
		if (shouldOpen) {
			setTimeout(async () => {
				try {
					await open(`http://${host}:${port}`);
					console.log(`🌐 Opened browser at http://${host}:${port}`);
				} catch {
					console.log(
						`ℹ️  Browser could not be opened automatically. Please visit http://${host}:${port}`,
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

program
	.command("version")
	.description("Show version information")
	.action(() => {
		console.log("Container Use UI v1.0.0");
	});

program.parse();
