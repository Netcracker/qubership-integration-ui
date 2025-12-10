import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./styles/theme-variables.css";
import "./styles/antd-overrides.css";
import "./index.css";
import "./components/graph/nodes/Node.component.css";
import { isVsCode } from "./api/rest/vscodeExtensionApi.ts";
import AppExtension from "./AppExtension.tsx";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

loader.config({ monaco });

if (isVsCode) {
  createRoot(document.getElementById("app-root") as HTMLElement).render(
    <StrictMode>
      <AppExtension />
    </StrictMode>,
  );
} else {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

