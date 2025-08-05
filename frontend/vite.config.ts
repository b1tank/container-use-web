import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
	server: {
		allowedHosts: ["localhost"],
	},
	envDir: resolve(__dirname, "../"),
	build: {
		chunkSizeWarningLimit: 600,
		rollupOptions: {
			output: {
				manualChunks: {
					// React core
					react: ["react", "react-dom"],

					// TanStack ecosystem
					tanstack: [
						"@tanstack/react-query",
						"@tanstack/react-router",
						"@tanstack/react-router-devtools",
					],

					// UI and styling libraries
					ui: [
						"@radix-ui/react-context-menu",
						"@radix-ui/react-dropdown-menu",
						"@radix-ui/react-separator",
						"@radix-ui/react-slot",
						"@radix-ui/react-tabs",
						"@radix-ui/react-toggle",
						"@radix-ui/react-toggle-group",
						"@radix-ui/react-tooltip",
						"class-variance-authority",
						"clsx",
						"tailwind-merge",
						"lucide-react",
					],

					// Code editor
					monaco: ["monaco-editor", "@monaco-editor/react"],

					// Terminal
					terminal: ["@xterm/xterm", "@xterm/addon-fit"],

					// Utilities
					utils: ["axios", "socket.io-client", "zod", "react-resizable-panels"],
				},
			},
		},
	},
});
