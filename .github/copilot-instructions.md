# General Coding Practices

- Use clear and descriptive variable and function names.
- Write modular and reusable code.
- Include comments and documentation for complex logic.
- Follow consistent code formatting and style guidelines.

# Preferred Technologies

- Use node.js and hono for backend development.
- Use TypeScript and tanstack router/query for frontend development.
- Use React and popular libraries for building user interfaces.
- Use pnpm for package management for both frontend and backend.
- Use Tanstack router for routing in React applications.
- Use latest version of Shadcn UI for UI components (install cmd, e.g. `pnpm dlx shadcn@latest add accordion`).
- Use Tailwind CSS for styling.
- Use the latest version of all libraries and frameworks (use fetch tool to check for updates).

# Action Requirements

- For end-to-end features, always first implement the backend API, then generate the client sdk using `./scripts/generate-client.sh`, and finally implement the frontend UI.
- Before implementing any UI feature, always check if there is shadcn UI component available that fits the requirement directly or can be easily adapted.
- Always summarize your implementation plan before starting to write code.
- You summarization should be presented in a way that is easy for me to check or dispute item by item.
- You summary after implementation should include a lean statement summarizing TL;DR of what you did, a list of all dependencies, folders, files that were created, modified or deleted, with a brief description of each, and next steps if applicable.
