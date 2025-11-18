import { VSCodeResponse } from "../dist-lib/types";
import { AppExtensionProps } from "./appConfig.ts";

export const APP_EXTENSION_UPDATE = "APP_EXTENSION_UPDATE";

export const appExtensionEvents = new EventTarget();

export function emitAppExtensionUpdate(message: VSCodeResponse<AppExtensionProps>) {
  appExtensionEvents.dispatchEvent(
    new CustomEvent(APP_EXTENSION_UPDATE, { detail: message }),
  );
}

export function initGlobalAppConfig() {
  window.addEventListener(
    "message",
    (event: MessageEvent<VSCodeResponse<AppExtensionProps>>) => {

      emitAppExtensionUpdate(event.data);
    },
  );
}
