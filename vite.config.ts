import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sassDts from "vite-plugin-sass-dts";
import pegjsPlugin from "rollup-plugin-pegjs";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

// CSP nonce for development; production should use dynamic nonces via server
const CSP_NONCE = "123";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sassDts(),
    pegjsPlugin(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'css', 'html', 'typescript'],
    }),
  ],
  html: {
    cspNonce: CSP_NONCE, // Vite will inject this nonce into script/style tags
  },
  build: {
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    host: true,
    port: 4200,
    hmr: {
      clientPort: 4200
    }
  },
});
