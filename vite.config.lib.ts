import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sassDts from 'vite-plugin-sass-dts';
import dts from "vite-plugin-dts";

const external = [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'antd',
    'tailwindcss',
    '@tanstack/react-query',
    '@tanstack/router-devtools',
    '@tanstack/router-plugin'
];

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
    ],
    build: {
        outDir: 'dist-lib',
        emptyOutDir: true,
        lib: {
            entry: 'src/index.ts',
            name: 'QIP-UI',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external
        },
    },
});
