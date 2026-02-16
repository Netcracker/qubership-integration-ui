import { AiModelProvider } from "./AiModelProvider.ts";
import { ChatMessage, ChatRequest, ChatResponse, ProviderCapabilities } from "./types.ts";

const mockCapabilities: ProviderCapabilities = {
  supportsStreaming: false,
  supportsTools: false,
};

export class MockAiModelProvider implements AiModelProvider {
  id = "mock";
  displayName = "Mock AI provider";
  capabilities: ProviderCapabilities = mockCapabilities;

  chat(request: ChatRequest): Promise<ChatResponse> {
    if (request.abortSignal?.aborted) {
      return Promise.reject(new Error("Request aborted"));
    }

    const lastUserMessage: ChatMessage | undefined = [...request.messages]
      .reverse()
      .find((m) => m.role === "user");

    const userContent = lastUserMessage?.content ?? "";

    const assistantContent = this.buildMockResponse(userContent, request);

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: assistantContent,
    };

    return Promise.resolve({
      messages: [...request.messages, assistantMessage],
      usage: {
        inputTokens: userContent.length,
        outputTokens: assistantContent.length,
        totalTokens: userContent.length + assistantContent.length,
      },
      finishReason: "mock",
    });
  }

  private buildMockResponse(userContent: string, request: ChatRequest): string {
    const hasChainContext = request.messages.some((m: ChatMessage) =>
      m.content.toLowerCase().includes("chain"),
    );
    const hasServiceContext = request.messages.some((m: ChatMessage) =>
      m.content.toLowerCase().includes("service"),
    );

    const lines: string[] = [];

    lines.push("This is a mock AI provider response.");
    lines.push("");
    if (userContent) {
      lines.push("You wrote:");
      lines.push(userContent);
      lines.push("");
    }

    if (hasChainContext) {
      lines.push("Detected chain-related context. In real mode this would analyze the chain structure and behavior.");
    }
    if (hasServiceContext) {
      lines.push("Detected service-related context. In real mode this would inspect services and their usage.");
    }

    if (!hasChainContext && !hasServiceContext) {
      lines.push("No specific domain context detected. In real mode this would call a real model.");
    }

    return lines.join("\n");
  }
}

