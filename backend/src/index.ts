import * as os from "node:os";
import process from "node:process";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { environments } from "./routes/environments.js";
import { files } from "./routes/files.js";
import { CLI_COMMANDS, DEFAULT_CLI_PATH } from "./utils/constants.js";
import { handleTerminal } from "./utils/terminal.js";

const app = new OpenAPIHono();

// Create WebSocket setup
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Serve static files BEFORE applying basePath (this will be at /static/*)
app.use(
	"/static/*",
	serveStatic({
		root: "./src",
	}),
);

// WebSocket route for terminal
app.get(
	"/api/v1/terminal",
	upgradeWebSocket((c) => ({
		onOpen: (event, ws) => {
			console.log(`Terminal WebSocket connection opened`);
			if (ws.raw) {
				handleTerminal(ws.raw);
			}
		},
		onMessage: (event, ws) => {
			// Message handling is done in handleTerminal
		},
		onClose: (event, ws) => {
			console.log(`Terminal WebSocket connection closed`);
		},
		onError: (event, ws) => {
			console.error("Terminal WebSocket error:", event);
		},
	})),
);

// WebSocket route for environment-specific terminal
app.get(
	"/api/v1/environments/:id/terminal",
	upgradeWebSocket((c) => {
		const environmentId = c.req.param("id");
		const folder = c.req.query("folder");
		const cli = c.req.query("cli");

		// Get the folder parameter from query string, default to home directory
		const workingDir = folder || os.homedir();
		// Get the CLI command path from query string, default to constant
		const cliPath = cli || DEFAULT_CLI_PATH;

		return {
			onOpen: (event, ws) => {
				console.log(
					`Environment terminal WebSocket connection opened for environment: ${environmentId}`,
				);
				if (ws.raw) {
					handleTerminal(ws.raw, {
						command: CLI_COMMANDS.TERMINAL,
						environmentId,
						workingDir,
						cliPath,
					});
				}
			},
			onMessage: (event, ws) => {
				// Message handling is done in handleTerminal
			},
			onClose: (event, ws) => {
				console.log(
					`Environment terminal WebSocket connection closed for environment: ${environmentId}`,
				);
			},
			onError: (event, ws) => {
				console.error(
					`Environment terminal WebSocket error for environment ${environmentId}:`,
					event,
				);
			},
		};
	}),
);

// WebSocket route for watch
app.get(
	"/api/v1/watch",
	upgradeWebSocket((c) => {
		const folder = c.req.query("folder");
		const cli = c.req.query("cli");

		// Get the folder parameter from query string, default to home directory
		const workingDir = folder || os.homedir();
		// Get the CLI command path from query string, default to constant
		const cliPath = cli || DEFAULT_CLI_PATH;

		return {
			onOpen: (event, ws) => {
				console.log(`Watch WebSocket connection opened`);
				if (ws.raw) {
					handleTerminal(ws.raw, {
						command: CLI_COMMANDS.WATCH,
						workingDir,
						cliPath,
					});
				}
			},
			onMessage: (event, ws) => {
				// Message handling is done in handleTerminal
			},
			onClose: (event, ws) => {
				console.log(`Watch WebSocket connection closed`);
			},
			onError: (event, ws) => {
				console.error("Watch WebSocket error:", event);
			},
		};
	}),
);

// Apply base path to API routes only
const apiApp = app.basePath("/api/v1");

// Apply CORS middleware to API routes, i.e. /api/v1/*
apiApp.use("*", cors());

// Mount the environments routes
apiApp.route("/", environments);

// Mount the files routes
apiApp.route("/", files);

// The OpenAPI documentation will be available at /api/v1/doc
apiApp.doc("/doc", {
	openapi: "3.1.0",
	info: {
		title: "Container Use UI API",
		version: "1.0.0",
	},
});

// Serve the Swagger UI at /api/v1/ui
apiApp.get("/ui", swaggerUI({ url: "/api/v1/doc" }));

// Mount the API app under /api/v1
app.route("/api/v1", apiApp);

// Read PORT from environment variable, default to 8000
const port = parseInt(process.env.PORT || "8000");

// Create and start the server
const server = serve({
	port: port,
	fetch: app.fetch, // Use Hono's fetch handler
});

// Inject WebSocket support
injectWebSocket(server);
