import { EventEmitter } from "events"
import { AppExtensionProps } from "../../appConfig.ts";

class AppExtensionEventBus extends EventEmitter {}

export const appExtensionEvents = new AppExtensionEventBus();

export const APP_EXTENSION_UPDATE = "APP_EXTENSION_UPDATE";

export type AppExtensionUpdateEvent = AppExtensionProps;
