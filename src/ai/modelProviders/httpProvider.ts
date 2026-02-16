import { AiModelProvider } from "./AiModelProvider.ts";
import { ChatRequest, ChatResponse, ChatMessage, ProviderCapabilities, StreamingChunk } from "./types.ts";
import axios, { AxiosError } from "axios";

const capabilities: ProviderCapabilities = {
  supportsStreaming: false,
  supportsTools: true,
};

type ChatRequestBody = Omit<ChatRequest, "abortSignal">;

function getApiErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const maybe = data as { error?: unknown };
  return typeof maybe.error === "string" ? maybe.error : undefined;
}

export class HttpAiModelProvider implements AiModelProvider {
  id = "http";
  displayName = "HTTP AI Service Provider";
  capabilities = capabilities;

  constructor(private serviceUrl: string) {
    if (!serviceUrl) {
      throw new Error("AI service URL is required");
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const url = `${this.serviceUrl.replace(/\/$/, "")}/api/chat`;

    try {
      const requestBody: ChatRequestBody = {
        messages: request.messages,
        conversationId: request.conversationId,
        modelId: request.modelId,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        context: request.context,
        attachmentUrls: request.attachmentUrls,
      };

      const response = await axios.post<ChatResponse>(url, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 600000,
        signal: request.abortSignal,
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw this.handleApiError(error);
      }
      throw error;
    }
  }

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<void> {
    const url = `${this.serviceUrl.replace(/\/$/, "")}/api/chat/stream`;

    const controller = new AbortController();
    const signal = request.abortSignal ?? controller.signal;

    try {
      const requestBody: ChatRequestBody = {
        messages: request.messages,
        conversationId: request.conversationId,
        modelId: request.modelId,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        context: request.context,
        attachmentUrls: request.attachmentUrls,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });


      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `Streaming request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let chunkIndex = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";


        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) {
            continue;
          }

          const payload = line.slice("data:".length).trim();
          if (!payload) {
            continue;
          }

          try {
            const chunk = JSON.parse(payload) as StreamingChunk;
            chunkIndex++;
            onChunk(chunk);
          } catch {
            onChunk({
              type: "error",
              errorMessage: "Failed to parse streaming chunk",
            });
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to receive streaming response";
      onChunk({
        type: "error",
        errorMessage: message,
      });
    } finally {
      if (!request.abortSignal) {
        controller.abort();
      }
    }
  }

  /**
   * Non-streaming chat that streams progress events (SSE) as tools run, then returns the final response.
   * Use when the LLM does not support streaming but you want live progress (e.g. "Created system", "Importing spec...").
   */
  async chatWithProgress(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<ChatResponse> {
    const url = `${this.serviceUrl.replace(/\/$/, "")}/api/chat/with-progress`;

    const controller = new AbortController();
    const signal = request.abortSignal ?? controller.signal;

    const requestBody: ChatRequestBody = {
      messages: request.messages,
      conversationId: request.conversationId,
      modelId: request.modelId,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      context: request.context,
      attachmentUrls: request.attachmentUrls,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    return new Promise<ChatResponse>((resolve, reject) => {
      const processBuffer = (): void => {
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice("data:".length).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload) as { type: string; progressMessage?: string; toolName?: string; toolArgs?: Record<string, unknown>; messages?: ChatMessage[]; usage?: ChatResponse["usage"]; finishReason?: string; errorMessage?: string; conversationId?: string };
            if (parsed.type === "progress" && parsed.progressMessage) {
              onChunk({
                type: "progress",
                progressMessage: parsed.progressMessage,
                toolName: parsed.toolName,
                toolArgs: parsed.toolArgs,
              });
            } else if (parsed.type === "done") {
              onChunk({ type: "done", finishReason: parsed.finishReason, usage: parsed.usage });
              resolve({
                messages: parsed.messages ?? [],
                usage: parsed.usage,
                finishReason: parsed.finishReason,
                conversationId: parsed.conversationId,
              });
              return;
            } else if (parsed.type === "error") {
              const msg = parsed.errorMessage ?? "Unknown error";
              onChunk({ type: "error", errorMessage: msg });
              reject(new Error(msg));
              return;
            }
          } catch {
            onChunk({ type: "error", errorMessage: "Failed to parse chunk" });
            reject(new Error("Failed to parse response chunk"));
            return;
          }
        }
      };

      (async () => {
        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            processBuffer();
          }
          if (buffer.trim()) processBuffer();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Request failed";
          onChunk({ type: "error", errorMessage: message });
          reject(err);
        } finally {
          if (!request.abortSignal) controller.abort();
        }
      })();
    });
  }

  async uploadFile(file: File, sessionId?: string): Promise<{ url: string }> {
    const url = `${this.serviceUrl.replace(/\/$/, "")}/api/upload`;
    const formData = new FormData();
    formData.append("file", file);
    if (sessionId) formData.append("sessionId", sessionId);
    const response = await axios.post<{ url: string }>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
    });
    return response.data;
  }

  private handleApiError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const message = getApiErrorMessage(error.response.data);

      if (status === 400) {
        return new Error(message || "Invalid request");
      }
      if (status === 401) {
        return new Error("Unauthorized. Check AI service configuration.");
      }
      if (status === 403) {
        return new Error("Access forbidden");
      }
      if (status === 429) {
        return new Error("Service is busy. Please try again in a moment.");
      }
      if (status === 503) {
        return new Error(
          message ||
            "AI service is not available. Please check service configuration."
        );
      }
      if (status >= 500) {
        return new Error(
          message || "AI service error. Please try again later."
        );
      }

      return new Error(message || `API error: ${status}`);
    }

    if (error.request) {
      return new Error(
        "Network error: Unable to reach AI service. Please check if the service is running."
      );
    }

    return new Error(`Request error: ${error.message}`);
  }
}

