import { IconOverrides } from "../dist-lib/types";
import { APP_EXTENSION_UPDATE, appExtensionEvents } from "./components/events/appExtensionEvents.ts";

let appNameValue: string = import.meta.env.VITE_API_APP;

/**
 * Sets the application name once on bootstrap. Subsequent reads use getAppName().
 * If name is falsy, the current value is preserved.
 */
function setAppName(name: string | undefined | null): void {
  if (typeof name === "string" && name.length > 0) {
    appNameValue = name;
  }
}

/**
 * Returns the current application name.
 */
export function getAppName(): string {
  return appNameValue;
}

export type AppExtensionProps = {
  appName?: string;
  icons?: IconOverrides;
};

export function configureAppExtension(message: AppExtensionProps) {
  setAppName(message.appName);
  appExtensionEvents.emit(APP_EXTENSION_UPDATE, message);
  console.info("Initial extension configuration succeeded");
}
