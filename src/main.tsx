import "./setupCspNonce";

import { StrictMode } from "react";

import "./styles/theme-variables.css";
import "./styles/antd-overrides.css";
import "./index.css";
import "./components/graph/nodes/Node.component.css";
import AppExtension from "./AppExtension.tsx";

import { createRoot } from "react-dom/client";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// @ts-ignore
self.MonacoEnvironment = {
  getWorker: (_, label) =>
    label === "json"
      ? new jsonWorker()
      : label === "css" || label === "scss" || label === "less"
        ? new cssWorker()
        : label === "html" || label === "handlebars" || label === "razor"
          ? new htmlWorker()
          : label === "typescript" || label === "javascript"
            ? new tsWorker()
            : new editorWorker(),
};

loader.config({monaco});


createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <AppExtension />
  </StrictMode>,
);
