/**
 * Bundled build only: configure @monaco-editor/loader to use the bundled Monaco
 * instance so it never loads from CDN (no script injection, CSP-safe).
 * This module is imported only from index.bundled.ts before the rest of the app.
 */
import loader from "@monaco-editor/loader";
import * as monaco from "monaco-editor";
import { getMonacoWorkerBasePath, setMonacoWorkerBasePath } from "./monaco-worker-config";

loader.config({ monaco });

// If host did not set worker base path, use host-provided global or derive from current script
if (typeof document !== "undefined" && getMonacoWorkerBasePath() === null) {
  const globalBase = (typeof window !== "undefined" && (window as Window & { __QIP_MONACO_WORKER_BASE__?: string }).__QIP_MONACO_WORKER_BASE__);
  if (globalBase) {
    setMonacoWorkerBasePath(globalBase);
  } else {
    const script = document.currentScript as HTMLScriptElement | null;
    if (script?.src) {
      try {
        const scriptUrl = new URL(script.src);
        const pathname = scriptUrl.pathname.replace(/\/[^/]*$/, "");
        scriptUrl.pathname = `${pathname}/assets/monaco-work`;
        setMonacoWorkerBasePath(scriptUrl.href);
      } catch {
        // ignore
      }
    }
  }
}
