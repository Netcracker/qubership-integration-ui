/**
 * External build: configure @monaco-editor/loader to use the host's Monaco instance
 * so it never loads from CDN. Default worker path is /assets/monaco-work so Vite apps
 * that use vite-plugin-monaco-editor-esm with customDistPath to assets/monaco-work
 * work without calling setMonacoWorkerBasePath. Imported from index.ts only.
 */
import * as monaco from "monaco-editor";
import { configureMonacoLoader } from "./monaco-loader-config";
import { getMonacoWorkerBasePath, setMonacoWorkerBasePath } from "./monaco-worker-config";

configureMonacoLoader({ monaco });

if (typeof window !== "undefined" && getMonacoWorkerBasePath() === null) {
  const base = `${window.location.origin}/`.replace(/\/+$/, "") + "/";
  setMonacoWorkerBasePath(`${base}assets/monaco-work`);
}
