import { ChatRequest, ChatResponse, ProviderCapabilities, StreamingChunk } from "./types.ts";

export interface AiModelProvider {
  id: string;
  displayName: string;
  capabilities: ProviderCapabilities;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat?(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<void>;
  /**
   * Non-streaming chat that still sends progress chunks (SSE) as tools run.
   * Use when the LLM does not support streaming but you want live progress in the UI.
   */
  chatWithProgress?(
    request: ChatRequest,
    onChunk: (chunk: StreamingChunk) => void
  ): Promise<ChatResponse>;
  /** Upload a file for chat attachment; returns object URL. Optional – only HTTP provider supports it. */
  uploadFile?(file: File, sessionId?: string): Promise<{ url: string }>;
}








