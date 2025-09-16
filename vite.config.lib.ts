import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sassDts from 'vite-plugin-sass-dts';
import dts from "vite-plugin-dts";
import * as path from "node:path";
import { nodeResolve } from '@rollup/plugin-node-resolve';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        sassDts(),
        dts({
            entryRoot: 'src',
            outDir: 'dist-lib/types',
            insertTypesEntry: true
        }),
        nodeResolve({ browser: true })
    ],
    build: {
        outDir: 'dist-lib',
        emptyOutDir: true,
        minify: false,
        sourcemap: false,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/main.tsx'),
        external: [],
        output: {
          format: 'es',
          entryFileNames: 'index.es.js',
          inlineDynamicImports: true,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'qip-ui.css';
            }
            return assetInfo.name || '[name].[ext]';
          },
        },
      }
    },
});
