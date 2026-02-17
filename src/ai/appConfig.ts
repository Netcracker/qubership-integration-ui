import { getAiServiceUrlOverride } from "../config/aiServiceUrlOverride.ts";

let aiServiceUrl: string | null = null;

export function setAiServiceUrl(url: string | undefined): void {
  aiServiceUrl = url || null;
}

/**
 * Returns the AI service URL: runtime override (from configure()) first,
 * then module state, then env, then window origin. Reading the override
 * at runtime ensures the built library respects configure({ aiServiceUrl }).
 */
export function getAiServiceUrl(): string | null {
  const configured = getAiServiceUrlOverride();
  if (configured) {
    return configured;
  }
  if (aiServiceUrl) {
    return aiServiceUrl;
  }

  const envUrl = import.meta.env.VITE_AI_SERVICE_URL;
  if (envUrl) {
    return envUrl;
  }

  if (
    typeof window !== "undefined" &&
    (window.location.protocol === "http:" || window.location.protocol === "https:")
  ) {
    return window.location.origin;
  }

  return null;
}


