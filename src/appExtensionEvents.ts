import { AppExtensionProps } from "./appConfig.ts";

export const APP_EXTENSION_UPDATE = "APP_EXTENSION_UPDATE";

export const appExtensionEvents = new EventTarget();

export function emitAppExtensionUpdate(message: AppExtensionProps) {
  appExtensionEvents.dispatchEvent(
    new CustomEvent(APP_EXTENSION_UPDATE, { detail: message }),
  );
}

export function initGlobalAppConfig() {
  window.addEventListener(
    "message",
    (event: MessageEvent<AppExtensionProps>) => {

      emitAppExtensionUpdate(event.data);
    },
  );
}
