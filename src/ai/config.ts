import { AiModelProvider } from "./modelProviders/AiModelProvider.ts";
import { HttpAiModelProvider } from "./modelProviders/httpProvider.ts";
import { getAiServiceUrl } from "./appConfig.ts";

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

    cachedProvider = new HttpAiModelProvider(serviceUrl);
  }
  return cachedProvider;
}

export function resetAiProvider(): void {
  cachedProvider = null;
}

