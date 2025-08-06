#!/usr/bin/env node

import { build } from "esbuild";
import { chmodSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const isDev = process.argv.includes("--dev") || process.argv.includes("-d");

console.log(`🔧 Building CLI${isDev ? " (development)" : " (production)"}...`);

// Ensure bin directory exists
const binDir = join(__dirname, "bin");
if (!existsSync(binDir)) {
	mkdirSync(binDir, { recursive: true });
}

const esbuildConfig = {
	entryPoints: ["src/cli.ts"],
	bundle: true,
	outfile: "bin/cli.js",
	platform: "node",
	target: "node18",
	format: "esm",
	minify: !isDev,
	sourcemap: isDev,
	external: [
		// Keep node built-ins external
		"node:*",
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify(
			isDev ? "development" : "production",
		),
	},
	banner: {
		js: `#!/usr/bin/env node
// ESBuild bundle for cuui CLI
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
	},
	loader: {
		".json": "json",
	},
	logLevel: "info",
};

async function buildCLI() {
	try {
		await build(esbuildConfig);

		// Make CLI executable
		chmodSync(join(__dirname, "bin", "cli.js"), 0o755);

		console.log("✅ CLI build completed successfully!");

		if (!isDev) {
			console.log("📦 CLI bundle info:");
			console.log(`   Output: bin/cli.js`);
			console.log(`   Platform: Node.js`);
			console.log(`   Format: ESM`);
			console.log(`   Executable: Yes`);
		}
	} catch (error) {
		console.error("❌ CLI build failed:", error);
		process.exit(1);
	}
}

buildCLI();
