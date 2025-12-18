import { IconOverrides } from "./icons/IconProvider";

export interface AppConfig {
  apiGateway?: string;
  appName?: string;
  icons?: IconOverrides;
  styles?: {
    cssVariables?: Record<string, string>;
    additionalCss?: string[];
  };
}

const config: Partial<AppConfig> = {};

function getEnvGateway(): string | undefined {
  return import.meta.env.VITE_GATEWAY as string | undefined;
}

function getEnvAppName(): string | undefined {
  return import.meta.env.VITE_API_APP as string | undefined;
}

export function setIcons(icons?: IconOverrides) {
  if (icons) {
    config.icons = { ...config.icons, ...icons };
  }
}

export function getAppName(): string {
  return config.appName ?? getEnvAppName() ?? "";
}

export function getIcons(): IconOverrides {
  return config.icons ?? {};
}

export function getConfig(): AppConfig {
  return {
    apiGateway: config.apiGateway ?? getEnvGateway(),
    appName: config.appName ?? getEnvAppName(),
    icons: config.icons,
    styles: config.styles,
  };
}

export function configure(newConfig: Partial<AppConfig>): void {
  if (newConfig.apiGateway !== undefined) {
    config.apiGateway = newConfig.apiGateway;
  }
  if (newConfig.appName !== undefined) {
    config.appName = newConfig.appName;
  }
  if (newConfig.icons !== undefined) {
    config.icons = { ...config.icons, ...newConfig.icons };
  }
  if (newConfig.styles !== undefined) {
    config.styles = {
      ...config.styles,
      ...newConfig.styles,
      cssVariables: {
        ...config.styles?.cssVariables,
        ...newConfig.styles?.cssVariables,
      },
      additionalCss: newConfig.styles.additionalCss ?? config.styles?.additionalCss,
    };
  }
}

export type AppExtensionProps = {
  appName?: string;
  icons?: IconOverrides;
};

export function configureAppExtension(message: AppExtensionProps) {
  configure({
    appName: message.appName,
    icons: message.icons,
  });
  console.info("Initial extension configuration succeeded");
}
