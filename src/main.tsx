import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import "./index.css";
import "./components/graph/nodes/Node.component.css";
import { isVsCode } from "./api/rest/vscodeExtensionApi.ts";
import AppExtension from "./AppExtension.tsx";
import { ThemeProvider } from "./contexts/ThemeContext";

if (isVsCode) {
  createRoot(document.getElementById("app-root") as HTMLElement).render(
    <StrictMode>
      <ThemeProvider>
        <AppExtension />
      </ThemeProvider>
    </StrictMode>,
  );
} else {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  );
}

