import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Icon from "@ant-design/icons";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import type { CustomIconComponentProps } from "@ant-design/icons/lib/components/Icon";
import parse from "html-react-parser";
import { commonIcons, elementIcons } from "./IconDefenitions";
import { getConfig, onConfigChange } from "../appConfig.ts";

export type IconSource =
  | React.ComponentType<AntdIconProps>
  | string
  | React.ReactElement;

const allIcons = {
  ...commonIcons,
  ...elementIcons,
};

function normalizeSvgForTheme(svgString: string): string {
  let normalized = svgString;

  normalized = normalized.replace(
    /fill\s*=\s*["']#[0-9a-fA-F]{3,8}["']/gi,
    'fill="currentColor"',
  );

  normalized = normalized.replace(
    /stroke\s*=\s*["']#[0-9a-fA-F]{3,8}["']/gi,
    'stroke="currentColor"',
  );

  normalized = normalized.replace(
    /style\s*=\s*["']([^"']*)["']/gi,
    (_match: string, styleContent: string): string => {
      const newStyle = styleContent
        .replace(/fill:\s*#[0-9a-fA-F]{3,8}/gi, "fill: currentColor")
        .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/gi, "stroke: currentColor");
      return `style="${newStyle}"`;
    },
  );

  const elementsWithFill = ["path", "circle", "rect", "ellipse", "polygon"];
  elementsWithFill.forEach((tag: string) => {
    const regex = new RegExp(`<${tag}([^>]*)>`, "gi");
    normalized = normalized.replace(
      regex,
      (match: string, attributes: string): string => {
        if (
          !attributes.includes("fill=") &&
          !attributes.includes("fill:") &&
          !attributes.includes('fill="none"')
        ) {
          return `<${tag}${attributes} fill="currentColor">`;
        }
        return match;
      },
    );
  });

  return normalized;
}

export interface IconContextType {
  icons: IconOverrides;
  setIcons: (icons: IconOverrides) => void;
}

export const IconContext = createContext<IconContextType>({
  icons: allIcons,
  setIcons: () => {},
});

export const IconProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [icons, setIconsState] = useState<IconOverrides>(() => {
    const config = getConfig();
    return config.icons ? { ...allIcons, ...config.icons } : allIcons;
  });

  useEffect(() => {
    const applyConfig = (cfg: ReturnType<typeof getConfig>) => {
      if (cfg.icons) {
        setIconsState(() => ({ ...allIcons, ...cfg.icons }));
      } else {
        setIconsState(() => allIcons);
      }
    };

    applyConfig(getConfig());
    return onConfigChange((cfg) => applyConfig(cfg));
  }, []);

  const setIcons = (overrides: IconOverrides) => {
    setIconsState((prev) => ({
      ...prev,
      ...overrides,
    }));
  };

  return (
    <IconContext.Provider value={{ icons, setIcons }}>
      {children}
    </IconContext.Provider>
  );
};

export const useIcons = () => {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error("useIcons must be used within IconProvider");
  }
  return context;
};

interface OverridableIconProps extends Omit<AntdIconProps, "name"> {
  name: IconName;
}

export type IconName = keyof typeof allIcons | (string & {});

export type IconOverrides = {
  [K in IconName]?: IconSource;
};

export const OverridableIcon: React.FC<OverridableIconProps> = ({
  name,
  ...props
}) => {
  const icons = useIcons();
  const IconComponent = icons.icons[name];

  if (!IconComponent) {
    return null;
  }

  if (React.isValidElement(IconComponent)) {
    return React.cloneElement(IconComponent, props);
  }

  if (typeof IconComponent === "string") {
    const normalizedSvg = normalizeSvgForTheme(IconComponent.trim());
    const parsed = parse(normalizedSvg);

    // Handle case where parse returns an array (text nodes + SVG element)
    let svgElement: string | React.JSX.Element | React.JSX.Element[] | undefined = parsed;
    if (Array.isArray(parsed)) {
      // Find the first React element in the array (skip text nodes)
      svgElement = parsed.find((el) => React.isValidElement(el));
    }

    if (!React.isValidElement(svgElement)) {
      console.warn(
        `[IconProvider] Failed to parse icon "${name}". Parse result:`,
        parsed,
      );
      return null;
    }

    const sizedSvg = React.cloneElement(svgElement, {
      width: "1em",
      height: "1em",
      ...props,
    });
    return <Icon component={() => sizedSvg} {...props} />;
  }

  // If it's a React component, wrap it in Icon for proper prop handling
  if (typeof IconComponent === "function") {
    return (
      <Icon
        component={
          IconComponent as React.ComponentType<
            CustomIconComponentProps | React.SVGProps<SVGSVGElement>
          >
        }
        {...props}
      />
    );
  }

  console.warn(`[IconProvider] Unknown icon type for "${name}":`, IconComponent);
  return null;
};
