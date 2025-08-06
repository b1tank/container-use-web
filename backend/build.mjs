#!/usr/bin/env node

import { build } from "esbuild";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const isDev = process.argv.includes("--dev") || process.argv.includes("-d");
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

console.log(
	`🏗️  Building backend${isDev ? " (development)" : " (production)"}...`,
);

// Ensure dist directory exists
const distDir = join(__dirname, "dist");
if (!existsSync(distDir)) {
	mkdirSync(distDir, { recursive: true });
}

// Copy static files
console.log("📁 Copying static files...");
try {
	// Copy the entire static directory to dist
	const staticSrcDir = join(__dirname, "src", "static");
	const staticDistDir = join(distDir, "static");

	if (existsSync(staticSrcDir)) {
		mkdirSync(staticDistDir, { recursive: true });
		// For now, we'll handle the terminal directory specifically
		const terminalSrcDir = join(staticSrcDir, "terminal");
		const terminalDistDir = join(staticDistDir, "terminal");

		if (existsSync(terminalSrcDir)) {
			mkdirSync(terminalDistDir, { recursive: true });
			copyFileSync(
				join(terminalSrcDir, "index.html"),
				join(terminalDistDir, "index.html"),
			);
		}
	}
} catch (error) {
	console.warn("⚠️  Warning: Could not copy static files:", error.message);
}

const esbuildConfig = {
	entryPoints: ["src/index.ts"],
	bundle: true,
	outfile: "dist/index.js",
	platform: "node",
	target: "node18",
	format: "esm",
	minify: !isDev,
	sourcemap: isDev,
	external: [
		// Keep node built-ins external
		"node:*",
		// Keep native modules external
		"node-pty",
		"chokidar",
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify(
			isDev ? "development" : "production",
		),
	},
	banner: {
		js: `
// ESBuild bundle for container-use-ui backend
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
	},
	loader: {
		".json": "json",
	},
	logLevel: "info",
};

async function buildApp() {
	try {
		if (isWatch) {
			console.log("👀 Starting watch mode...");
			const context = await build({
				...esbuildConfig,
				watch: {
					onRebuild(error) {
						if (error) {
							console.error("❌ Watch build failed:", error);
						} else {
							console.log("✅ Rebuilt successfully");
						}
					},
				},
			});

			// Keep the process running
			process.on("SIGINT", () => {
				console.log("\n👋 Stopping watch mode...");
				context.dispose();
				process.exit(0);
			});
		} else {
			await build(esbuildConfig);
			console.log("✅ Build completed successfully!");

			if (!isDev) {
				console.log("📦 Bundle info:");
				console.log(`   Output: dist/index.js`);
				console.log(`   Platform: Node.js`);
				console.log(`   Format: ESM`);
			}
		}
	} catch (error) {
		console.error("❌ Build failed:", error);
		process.exit(1);
	}
}

buildApp();
