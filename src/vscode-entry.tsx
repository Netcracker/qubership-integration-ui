import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppExtension from "./AppExtension.tsx";

import "./styles/theme-variables.css";
import "./styles/antd-overrides.css";

// Initialize React app for VS Code extension
export function initializeVSCodeApp() {
  if (typeof window !== "undefined" && document.getElementById("app-root")) {
    console.log("QIP UI: Auto-initializing React app for VS Code");

    const rootElement = document.getElementById("app-root");
    if (rootElement) {
      createRoot(rootElement).render(
        <StrictMode>
          <AppExtension />
        </StrictMode>,
      );
      console.log("QIP UI: React app initialized successfully");
    } else {
      console.error("QIP UI: Element with id 'app-root' not found");
    }
  }
}

// Auto-initialize only if running in VS Code webview context
if (typeof window !== "undefined" && window.location.protocol === "vscode-webview:") {
  initializeVSCodeApp();
}

export default initializeVSCodeApp;
