import { OpenAPIHono } from "npm:@hono/zod-openapi";
import { environments } from "./routes/environments.ts";
import { swaggerUI } from "@hono/swagger-ui";
import { upgradeWebSocket } from "hono/deno";

const app = new OpenAPIHono().basePath("/api/v1");

// Mount the environments routes
app.route("/", environments);

// The OpenAPI documentation will be available at /api/v1/doc
app.doc("/doc", {
  openapi: "3.1.0",
  info: {
    title: "Container Use UI API",
    version: "1.0.0",
  },
});

// Serve the Swagger UI at /api/v1/ui
app.get("/ui", swaggerUI({ url: "/api/v1/doc" }));

// WebSocket endpoint
app.get(
  '/ws',
  upgradeWebSocket(() => {
    return {
      onMessage: (event) => {
        console.log(event.data)
      },
    }
  })
)

Deno.serve(app.fetch);
