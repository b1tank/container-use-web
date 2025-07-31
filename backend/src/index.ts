import process from "node:process";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { environments } from "./routes/environments.js";
import { files } from "./routes/files.js";
import { handleOpenTerminal } from "./utils/terminal.js";

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
	"/ws/v1/terminal",
	upgradeWebSocket((c) => ({
		onOpen: (event, ws) => {
			console.log(`Terminal WebSocket connection opened`);
			if (ws.raw) {
				handleOpenTerminal(ws.raw);
			}
		},
		onMessage: (event, ws) => {
			// Message handling is done in handleTerminalConnection
		},
		onClose: (event, ws) => {
			console.log(`Terminal WebSocket connection closed`);
		},
		onError: (event, ws) => {
			console.error("Terminal WebSocket error:", event);
		},
	})),
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

console.log(`API at http://localhost:${port}`);
console.log(`WebSocket at ws://localhost:${port}/ws/v1/terminal`);
