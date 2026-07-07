import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// The web app couples to the core ONLY through the contract seam (types +
// fixtures). It reads live data from the engine via the /api proxy, and falls
// back to fixtures for demo resilience.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@contract": fileURLToPath(new URL("../contract/ts/index.ts", import.meta.url)),
      "@fixtures": fileURLToPath(new URL("../contract/fixtures", import.meta.url)),
    },
  },
  server: {
    port: 5273,
    fs: { allow: [".", "../contract"] },
    proxy: {
      "/api": {
        target: process.env.AITIO_ENGINE || "http://localhost:8787",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
