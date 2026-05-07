import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    // Exclude Playwright e2e specs — those run via `pnpm test:e2e`
    exclude: ["tests/**/*.spec.ts", "node_modules/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
