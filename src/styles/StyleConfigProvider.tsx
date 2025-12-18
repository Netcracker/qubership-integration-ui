import { useEffect, ReactNode } from "react";
import { getConfig } from "../appConfig.ts";

interface StyleConfigProviderProps {
  children: ReactNode;
}

export function StyleConfigProvider({ children }: StyleConfigProviderProps) {
  useEffect(() => {
    const config = getConfig();
    const styles = config.styles;

    if (!styles) {
      return;
    }

    const root = document.documentElement;
    const cssVariables = styles.cssVariables;
    const additionalCss = styles.additionalCss;
    const cssVarKeys: string[] = [];
    const links: HTMLLinkElement[] = [];

    if (cssVariables) {
      Object.entries(cssVariables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
        cssVarKeys.push(key);
      });
    }

    if (additionalCss) {
      additionalCss.forEach((cssUrl) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssUrl;
        document.head.appendChild(link);
        links.push(link);
      });
    }

    return () => {
      cssVarKeys.forEach((key) => {
        root.style.removeProperty(key);
      });
      links.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, []);

  return <>{children}</>;
}
