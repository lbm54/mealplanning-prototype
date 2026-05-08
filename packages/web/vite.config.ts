import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  optimizeDeps: {
    include: [
      "use-sync-external-store/shim",
      "use-sync-external-store/shim/index.js",
    ],
  },
  ssr: {
    noExternal: [
      "@clerk/tanstack-react-start",
      "@clerk/clerk-react",
      "@clerk/shared",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
    // installDevServerMiddleware is missing from public types but supported at runtime —
    // forces TanStack Start's SSR middleware to install over Nitro's, otherwise Nitro
    // tries to read a (non-existent) index.html in dev. See commit 048785d.
    tanstackStart({ installDevServerMiddleware: true } as Parameters<typeof tanstackStart>[0]),
    nitro({ prerender: { routes: ["/"] } }),
    viteReact(),
    tailwindcss(),
  ],
});
