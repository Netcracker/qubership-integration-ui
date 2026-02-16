let aiServiceUrl: string | null = null;

export function setAiServiceUrl(url: string | undefined): void {
  aiServiceUrl = url || null;
}

export function getAiServiceUrl(): string | null {
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


