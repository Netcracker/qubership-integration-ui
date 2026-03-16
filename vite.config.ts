import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sassDts from "vite-plugin-sass-dts";

// Dev server config - uses same base as lib build
export default defineConfig({
  plugins: [react(), sassDts()],
  server: {
    host: true,
    port: 4300,
    hmr: {
      clientPort: 4300,
    },
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["lunr", "elasticlunr"],
  },
});
