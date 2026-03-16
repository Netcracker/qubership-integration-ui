import { AiModelProvider } from "./modelProviders/AiModelProvider.ts";
import { HttpAiModelProvider } from "./modelProviders/httpProvider.ts";
import { getAiServiceUrl, getAuthTokenGetter } from "./appConfig.ts";

let cachedProvider: AiModelProvider | null = null;

export function getDefaultAiProvider(): AiModelProvider {
  if (!cachedProvider) {
    const serviceUrl = getAiServiceUrl();

    if (!serviceUrl) {
      throw new Error(
        "AI service is not configured. Please set VITE_AI_SERVICE_URL environment variable " +
        "or configure aiServiceUrl in VS Code extension settings."
      );
    }

    const getToken = getAuthTokenGetter() ?? undefined;
    cachedProvider = new HttpAiModelProvider(serviceUrl, getToken);
  }
  return cachedProvider;
}

export function resetAiProvider(): void {
  cachedProvider = null;
}

