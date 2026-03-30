import { AiModelProvider } from "./AiModelProvider.ts";
import { ChatRequest, ChatResponse, ChatMessage, ProviderCapabilities, StreamingChunk, HitlCheckpointPayload } from "./types.ts";
import axios, { AxiosError } from "axios";
import { getHeadersForContext } from "../../api/rest/requestHeadersInterceptor.ts";

const capabilities: ProviderCapabilities = {
  supportsStreaming: true,
  supportsTools: true,
};

/** Shape sent to POST /api/v1/chat */
interface CipChatRequestBody {
  message: string;
  conversationId?: string;
  /** Optional inline context: chain schema, attachment URLs, etc. */
  attachment?: string;
  scenarioHint: null;
}

function getApiErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const maybe = data as { error?: unknown };
  return typeof maybe.error === "string" ? maybe.error : undefined;
}

function getBearerHeader(serviceUrl: string, path: string): Record<string, string> {
  const base = serviceUrl.replace(/\/$/, "");
  const url = `${base}${path}`;
  const raw = getHeadersForContext({ url, baseURL: base });
  const auth = raw?.Authorization;
  if (typeof auth !== "string") return {};
  return { Authorization: auth };
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
    const url = `${this.serviceUrl.replace(/\/$/, "")}/api/v1/chat`;
    try {
      const requestBody: CipChatRequestBody = {
        message: this.extractLastUserMessage(request.messages),
        conversationId: request.conversationId,
        attachment: this.buildAttachment(request) || undefined,
        scenarioHint: null,
      };
      const response = await axios.post<ChatResponse>(url, requestBody, {
        headers: {
          "Content-Type": "application/json",
          ...getBearerHeader(this.serviceUrl, "/api/v1/chat"),
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

  // ── streamChat ────────────────────────────────────────────────────────────
  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<void> {
    const base = this.serviceUrl.replace(/\/$/, "");
    const url = `${base}/api/v1/chat`;

    const controller = new AbortController();
    const signal = request.abortSignal ?? controller.signal;

    try {
      const requestBody: CipChatRequestBody = {
        message: this.extractLastUserMessage(request.messages),
        conversationId: request.conversationId,
        attachment: this.buildAttachment(request) || undefined,
        scenarioHint: null,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...getBearerHeader(this.serviceUrl, "/api/v1/chat"),
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by \n\n
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (part.trim()) {
            this.parseSseBlock(part, onChunk);
          }
        }
      }

      // Flush any remaining buffered event
      if (buffer.trim()) {
        this.parseSseBlock(buffer, onChunk);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to receive streaming response";
      onChunk({ type: "error", errorMessage: message });
    } finally {
      if (!request.abortSignal) {
        controller.abort();
      }
    }
  }

  // ── chatWithProgress ──────────────────────────────────────────────────────
  // Delegates to streamChat and wraps it in a ChatResponse promise.
  // supportsStreaming is true, so AiAssistant will not call this; kept for completeness.
  async chatWithProgress(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<ChatResponse> {
    const messages: ChatMessage[] = [...request.messages];
    let conversationId: string | undefined;

    return new Promise<ChatResponse>((resolve, reject) => {
      this.streamChat(request, (chunk) => {
        onChunk(chunk);
        if (chunk.type === "done") {
          conversationId = chunk.conversationId;
          resolve({ messages, conversationId, finishReason: chunk.finishReason, usage: chunk.usage });
        } else if (chunk.type === "error") {
          reject(new Error(chunk.errorMessage ?? "Stream error"));
        } else if (chunk.type === "delta" && chunk.contentDelta) {
          const last = messages[messages.length - 1];
          if (last?.role === "assistant") {
            messages[messages.length - 1] = { ...last, content: last.content + chunk.contentDelta };
          } else {
            messages.push({ role: "assistant", content: chunk.contentDelta });
          }
        }
      }).catch(reject);
    });
  }

  // ── uploadFile ────────────────────────────────────────────────────────────
  // The Quarkus backend does not expose a file-upload endpoint.
  // AiAssistant handles the failure gracefully and proceeds without attachment.
  async uploadFile(_file: File, _sessionId?: string): Promise<{ url: string }> {
    throw new Error("File upload is not supported by this AI service.");
  }


  private parseSseBlock(block: string, onChunk: (chunk: StreamingChunk) => void): void {
    let eventType: string | null = null;
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        eventType = line.slice("event:".length).replace(/^ /, "").trimEnd();
      } else if (line.startsWith("data:")) {
        // Per SSE spec: remove exactly one leading space after "data:"
        dataLines.push(line.slice("data:".length).replace(/^ /, ""));
      }
    }

    if (!eventType && dataLines.length > 0) {
      const nestedDataLines: string[] = [];
      for (const nested of dataLines) {
        if (nested.startsWith("event:")) {
          eventType = nested.slice("event:".length).replace(/^ /, "").trimEnd();
        } else if (nested.startsWith("data:")) {
          const value = nested.slice("data:".length).replace(/^ /, "");
          // Keep empty values from nested `data:` lines: they can represent newline tokens.
          nestedDataLines.push(value);
        } else {
          // Ignore wrapper-only blank lines; keep meaningful non-empty payload.
          if (nested.length > 0) nestedDataLines.push(nested);
        }
      }
      dataLines.length = 0;
      dataLines.push(...nestedDataLines);
    }

    if (!eventType || dataLines.length === 0) return;

    // Multiple data: lines in one event are joined with \n (SSE spec §9.2.6)
    const payload = dataLines
      .filter((line) => !line.startsWith("event:") && !line.startsWith("data:"))
      .join("\n");

    switch (eventType) {
      case "token":
        onChunk({ type: "delta", contentDelta: payload });
        break;

      case "done":
        onChunk({ type: "done", conversationId: payload || undefined });
        break;

      case "error":
        onChunk({ type: "error", errorMessage: payload });
        break;

      case "hitl_checkpoint":
        try {
          const hitlData = JSON.parse(payload) as HitlCheckpointPayload;
          onChunk({ type: "hitl_checkpoint", hitlCheckpoint: hitlData });
        } catch {
          onChunk({ type: "error", errorMessage: `Failed to parse HITL checkpoint: ${payload}` });
        }
        break;

      default:
        // Unknown event type — silently ignored
        break;
    }
  }

  private extractLastUserMessage(messages: ChatMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        return messages[i].content;
      }
    }
    return messages[messages.length - 1]?.content ?? "";
  }

  private buildAttachment(request: ChatRequest): string {
    const parts: string[] = [];

    if (request.context?.compactSchema) {
      const schema = request.context.compactSchema;
      parts.push(
        `## Current Chain: ${schema.chainName} (ID: ${schema.chainId})\n` +
        "```json\n" +
        JSON.stringify(schema, null, 2) +
        "\n```"
      );
    }

    if (request.attachmentUrls?.length) {
      parts.push(
        "## Attached Documents\n" +
        request.attachmentUrls.map((url) => `- ${url}`).join("\n")
      );
    }

    return parts.join("\n\n");
  }

  private handleApiError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const message = getApiErrorMessage(error.response.data);

      if (status === 400) return new Error(message || "Invalid request");
      if (status === 401) return new Error("Unauthorized. Check AI service configuration.");
      if (status === 403) return new Error("Access forbidden");
      if (status === 429) return new Error("Service is busy. Please try again in a moment.");
      if (status === 503) return new Error(message || "AI service is not available.");
      if (status >= 500) return new Error(message || "AI service error. Please try again later.");
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
