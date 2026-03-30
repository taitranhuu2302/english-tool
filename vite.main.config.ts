import { defineConfig } from "vite";
import path from "node:path";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // bufferutil / utf-8-validate are optional native deps of "ws" used by
      // groq-sdk / @google/genai. They are not installed; mark them external so
      // Vite doesn't try to bundle them and the runtime falls back gracefully.
      // better-sqlite3 has native .node files - mark external so it stays in node_modules
      external: ["bufferutil", "utf-8-validate", "better-sqlite3"],
    },
  },
});
