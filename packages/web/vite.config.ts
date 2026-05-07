import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  server: {
    port: Number(process.env.PORT ?? 3000),
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  plugins: [
    tanstackStart(),
    tailwindcss(),
  ],
  ssr: {
    noExternal: [
      "@clerk/tanstack-react-start",
      "@clerk/clerk-react",
      "@clerk/shared",
    ],
  },
});
