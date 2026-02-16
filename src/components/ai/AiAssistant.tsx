import { Button, Drawer, Tabs, Space, Input, Typography, Divider, Tooltip, Alert } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from "react";
import "./AiAssistantPanel.css";
import { OverridableIcon } from "../../icons/IconProvider.tsx";
import { getDefaultAiProvider } from "../../ai/config.ts";
import { ChatMessage, ChatResponse, ChatUsage, StreamingChunk } from "../../ai/modelProviders/types.ts";
import type { ChatRequest } from "../../ai/modelProviders/types.ts";
import { ChatSession } from "../../ai/sessions/types.ts";
import { getChatSessionStore } from "../../ai/sessions/sessionStore.ts";
import { AiModelProvider } from "../../ai/modelProviders/AiModelProvider.ts";
import { useChainContext } from "./useChainContext.ts";
import { ChainContext as PageChainContext } from "../../pages/ChainPage.tsx";
import { api } from "../../api/api.ts";
import { getConfig } from "../../appConfig.ts";
import {
  ChainModificationConfirmation,
  ChainModificationProposal,
} from "./ChainModificationConfirmation.tsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { Components } from "react-markdown";

type ChatMeta = {
  durationMs: number;
  finishReason?: string;
  usage?: ChatUsage;
};

function parseChatMeta(value: string): ChatMeta | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const meta = parsed as { durationMs?: unknown; finishReason?: unknown; usage?: unknown };
    if (typeof meta.durationMs !== "number") return null;
    const usage =
      meta.usage && typeof meta.usage === "object"
        ? (meta.usage as { totalTokens?: unknown; inputTokens?: unknown; outputTokens?: unknown })
        : undefined;
    const normalizedUsage: ChatUsage | undefined = usage
      ? {
          totalTokens: typeof usage.totalTokens === "number" ? usage.totalTokens : undefined,
          inputTokens: typeof usage.inputTokens === "number" ? usage.inputTokens : undefined,
          outputTokens: typeof usage.outputTokens === "number" ? usage.outputTokens : undefined,
        }
      : undefined;

    return {
      durationMs: meta.durationMs,
      finishReason: typeof meta.finishReason === "string" ? meta.finishReason : undefined,
      usage: normalizedUsage,
    };
  } catch {
    return null;
  }
}

function getRoleLabel(role: ChatMessage["role"], assistantName: string): string {
  if (role === "user") return "You";
  if (role === "assistant") return assistantName;
  return "System";
}

function extractMarkdownText(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map((c) => (typeof c === "string" ? c : "")).join("");
  }
  return "";
}

function getResponseTail(
  requestMessages: ChatMessage[],
  responseMessages: ChatMessage[],
): ChatMessage[] {
  const firstRequest = requestMessages[0];
  const responseStartIndex =
    firstRequest
      ? responseMessages.findIndex(
          (message) =>
            message.role === firstRequest.role && message.content === firstRequest.content,
        )
      : -1;

  const responseBaseIndex = responseStartIndex >= 0 ? responseStartIndex : 0;
  const maxPrefix = Math.min(
    requestMessages.length,
    responseMessages.length - responseBaseIndex,
  );
  let matchedCount = 0;
  for (; matchedCount < maxPrefix; matchedCount += 1) {
    const req = requestMessages[matchedCount];
    const res = responseMessages[responseBaseIndex + matchedCount];
    if (!req || !res || req.role !== res.role || req.content !== res.content) {
      break;
    }
  }
  return responseMessages.slice(responseBaseIndex + matchedCount);
}

const markdownComponents: Components = {
  code(props) {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || "");
    const code = extractMarkdownText(children).replace(/\n$/, "");

    if (!match) {
      return (
        <code className="ai-inline-code" {...rest}>
          {children}
        </code>
      );
    }

    const language = match[1] || "text";
    return (
      <div className="ai-code-block">
        <div className="ai-code-block__header">
          <span className="ai-code-block__lang">{language}</span>
          <Button
            size="small"
            type="text"
            className="ai-code-block__copy"
            onClick={() => {
              void navigator.clipboard?.writeText(code);
            }}
          >
            Copy
          </Button>
        </div>
        <SyntaxHighlighter language={language} PreTag="div">
          {code}
        </SyntaxHighlighter>
      </div>
    );
  },
};

const MarkdownRendererInner: React.FC<{ children: string }> = ({ children }) => {
  const normalizedContent = useMemo(() => (children ? String(children) : ""), [children]);

  return (
    <div className="ai-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

// Memoized MarkdownRenderer to prevent expensive re-parsing on every render
const MarkdownRenderer = React.memo(MarkdownRendererInner, (prev, next) => {
  return prev.children === next.children;
});

// Progress line from backend: "> 💡 Creating element...\n" or "> 💡 Creating element - completed"
const PROGRESS_LINE_REGEX = /^>\s*💡\s*(.+)$/gm;
const COMPLETED_SUFFIX = / - completed/i;
const ERROR_SUFFIX = / - error:\s*/i;

export type ProgressLineStatus = "success" | "error" | "pending";

export interface ParsedProgressLine {
  text: string;
  status: ProgressLineStatus;
}

function parseProgressLines(content: string): ParsedProgressLine[] {
  const re = new RegExp(PROGRESS_LINE_REGEX.source, "gm");
  const lines: ParsedProgressLine[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const text = match[1].trim();
    let status: ProgressLineStatus = "pending";
    if (COMPLETED_SUFFIX.test(text)) status = "success";
    else if (ERROR_SUFFIX.test(text)) status = "error";
    lines.push({ text, status });
  }
  return lines;
}

/** Collapse progress: show completed steps + current in-progress. Current = last line if pending, else last pending after last completed (avoids duplicate after completed). */
function collapseProgressLines(lines: ParsedProgressLine[]): ParsedProgressLine[] {
  if (lines.length === 0) return [];
  const completed = lines.filter((l) => l.status === "success" || l.status === "error");
  const lastLine = lines[lines.length - 1];
  const lastCompletedIndex = lines.map((l, i) => (l.status === "success" || l.status === "error" ? i : -1))
    .filter((i) => i >= 0)
    .pop() ?? -1;
  const pendingAfterLastCompleted = lines.slice(lastCompletedIndex + 1).filter((l) => l.status === "pending");
  const lastRealPending = pendingAfterLastCompleted.length > 0 ? pendingAfterLastCompleted[pendingAfterLastCompleted.length - 1] : null;
  const currentStep =
    lastLine?.status === "pending"
      ? lastLine
      : lastRealPending;
  return [...completed, ...(currentStep ? [currentStep] : [])];
}

/** Remove progress blocks ("> 💡 ...") from content so narrative can be rendered without duplication */
function stripProgressBlocks(content: string): string {
  return content
    .replace(/(\n\n>\s*💡\s*[^\n]+)+/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Remove inline progress summary lines (e.g. "💡 Chain: ... - completed 💡 Elements: ... - completed") */
function stripInlineProgressSummary(content: string): string {
  return content
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      // Drop lines that consist only of "💡 ... - completed" (one or more such segments)
      return !/^(💡[^💡]*?- completed\s*)+$/u.test(t);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Return start/end indices of chain-modification-proposal JSON in content, or null */
function findChainModificationProposalRange(content: string): { start: number; end: number } | null {
  const marker = '"type":"chain-modification-proposal"';
  const idx = content.indexOf(marker);
  if (idx === -1) return null;
  const start = content.lastIndexOf("{", idx);
  if (start === -1) return null;
  for (let end = content.length; end > start + marker.length; end--) {
    const slice = content.slice(start, end);
    try {
      const parsed: unknown = JSON.parse(slice);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as { type?: unknown }).type === "chain-modification-proposal"
      ) {
        return { start, end };
      }
    } catch {
      // continue
    }
  }
  return null;
}

/** Replace chain-modification-proposal JSON in display content with a short summary (JSON stays in message for Apply) */
function replaceChainModificationProposalForDisplay(content: string): string {
  const range = findChainModificationProposalRange(content);
  if (!range) return content;
  const before = content.slice(0, range.start).trimEnd();
  const after = content.slice(range.end).trimStart();
  const summary = "\n\n*Chain modification proposal – use **Apply changes** to confirm.*\n\n";
  return [before, summary, after].join("").replace(/\n{3,}/g, "\n\n").trim();
}

/** Detect if assistant message looks like a design-execution plan (to-do list + confirm CTA) */
function looksLikePlanResponse(content: string): boolean {
  if (!content || content.length < 30) return false;
  const lower = content.toLowerCase();
  const hasNumberedList =
    (/\n\s*1\.\s/.test(content) && (/\n\s*2\.\s/.test(content) || /\n\s*[2-9]\.\s/.test(content))) ||
    /\n\s*1\)\s/.test(content) ||
    /^1\.\s/m.test(content);
  const invitesConfirm =
    lower.includes("agree") ||
    lower.includes("execute plan") ||
    lower.includes("execute the plan") ||
    lower.includes("proceed") ||
    lower.includes("confirm");
  return hasNumberedList && invitesConfirm;
}

/** Detect if assistant message is a chain validation result */
function looksLikeValidationResult(content: string): boolean {
  if (!content) return false;
  const lower = content.toLowerCase();
  return (
    (lower.includes("chain validation completed") || lower.includes("validation completed")) &&
    lower.includes("navigate to") &&
    lower.includes("sessions")
  );
}

/** True if the last user message in the thread is a short "Agree" / "Execute" confirm (user already clicked Execute plan). */
function lastUserMessageIsAgree(messages: ChatMessage[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || typeof lastUser.content !== "string") return false;
  const t = lastUser.content.trim().toLowerCase();
  return (
    t === "agree" ||
    t === "execute" ||
    t === "execute the plan" ||
    t === "proceed" ||
    t === "yes" ||
    (t.length < 50 && (t.includes("agree") || t.includes("execute")))
  );
}

const ATTACHMENT_URL_PATTERN = /https?:\/\/[^\s"'<>)]*\/attachments\/[0-9a-f-]{36}(?:[^\s"'<>)]*)?/gi;

/**
 * Extract the first design/attachment URL from any message in the thread.
 * Used when building the "Agree" request so the backend can persist the design URL in the chain
 * even if lastAttachmentUrls was not set (e.g. design link only appeared in assistant message).
 */
function extractDesignUrlFromMessages(messages: ChatMessage[]): string | undefined {
  for (const msg of messages) {
    const content = typeof msg.content === "string" ? msg.content : "";
    const match = content.match(ATTACHMENT_URL_PATTERN);
    if (match?.[0]) return match[0];
  }
  return undefined;
}

const ExecutionLog: React.FC<{
  lines: ParsedProgressLine[];
  defaultCollapsed?: boolean;
  title?: string;
}> = React.memo(({ lines, defaultCollapsed = false, title = "Execution log" }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (lines.length === 0) return null;
  return (
    <div className="ai-execution-log">
      <button
        type="button"
        className="ai-execution-log__header"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <span className="ai-execution-log__title">{title}</span>
        <span className="ai-execution-log__count">{lines.length} step{lines.length !== 1 ? "s" : ""}</span>
        <span className="ai-execution-log__chevron">{collapsed ? "▶" : "▼"}</span>
      </button>
      {!collapsed && (
        <div className="ai-execution-log__body" role="log">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`ai-execution-log__line ai-execution-log__line--${line.status}`}
              title={line.text}
            >
              <span className="ai-execution-log__step-num">{i + 1}</span>
              <span className="ai-execution-log__icon">
                {line.status === "success" && "✓"}
                {line.status === "error" && "✗"}
                {line.status === "pending" && "○"}
              </span>
              <span className="ai-execution-log__text">
                {line.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const DRAWER_WIDTH_STORAGE_KEY = "ai-assistant-drawer-width";
const DEFAULT_DRAWER_WIDTH = 500;
const MIN_DRAWER_WIDTH = 300;
const MAX_DRAWER_WIDTH = 1200;
const INPUT_TEXTAREA_ROWS = 3;
const SEND_KEY = "Enter";

// Throttle interval for UI updates during streaming (ms)
const UI_REFRESH_THROTTLE_MS = 150;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

export const AiAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const sessionStore = getChatSessionStore();
  const chainContext = useChainContext();
  const pageChainContext = useContext(PageChainContext);

  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [inputValue, setInputValue] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  /** Prevents double submission (e.g. double-click or re-invoke) */
  const sendInProgressRef = useRef(false);

  // Refs for throttled UI updates during streaming
  const lastUiRefreshTimeRef = useRef(0);
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to store streaming content without triggering re-renders
  const streamingContentRef = useRef<string>("");

  const [pendingProposal, setPendingProposal] = useState<ChainModificationProposal | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [showLongRunningHint, setShowLongRunningHint] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assistantName = getConfig().aiAssistantName;
  /** Cycling suffix for "Working" step: . .. ... .. . */
  const [workingDots, setWorkingDots] = useState(0);

  const [drawerWidth, setDrawerWidth] = useState(() => {
    const savedWidth = safeStorageGet(DRAWER_WIDTH_STORAGE_KEY);
    const parsed = savedWidth ? parseInt(savedWidth, 10) : DEFAULT_DRAWER_WIDTH;
    const maxAllowed =
      typeof window !== "undefined" ? Math.min(MAX_DRAWER_WIDTH, window.innerWidth) : MAX_DRAWER_WIDTH;
    return clamp(Number.isFinite(parsed) ? parsed : DEFAULT_DRAWER_WIDTH, MIN_DRAWER_WIDTH, maxAllowed);
  });

  const [isResizing, setIsResizing] = useState(false);
  const drawerWidthRef = React.useRef<number>(drawerWidth);
  const drawerWrapperRef = React.useRef<HTMLElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const inputRef = React.useRef<TextAreaRef | null>(null);

  useEffect(() => {
    if (!isLoading && !isStreaming) {
      setShowLongRunningHint(false);
      return;
    }
    const t = setTimeout(() => setShowLongRunningHint(true), 4000);
    return () => clearTimeout(t);
  }, [isLoading, isStreaming]);

  const WORKING_DOTS = [".", "..", "..."];
  useEffect(() => {
    if (!isLoading && !isStreaming) return;
    const interval = setInterval(() => {
      setWorkingDots((d) => (d + 1) % WORKING_DOTS.length);
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading, isStreaming]);

  useEffect(() => {
    if (currentSessionId) {
      const session = sessionStore.getSession(currentSessionId);
      if (session) {
        setCurrentSession((prevSession) => {
          if (prevSession && prevSession.id === currentSessionId) {
            const prevMessagesCount = prevSession.messages.length;
            const newMessagesCount = session.messages.length;
            if (prevMessagesCount >= newMessagesCount) {
              return prevSession;
            }
          }
          return {
            ...session,
            messages: [...session.messages],
          };
        });
      } else {
        setCurrentSession(null);
      }
    } else {
      setCurrentSession(null);
    }
  }, [currentSessionId, sessionStore]);

  useEffect(() => {
    drawerWidthRef.current = drawerWidth;
  }, [drawerWidth]);

  useEffect(() => {
    if (!open) return;
    const maxAllowed = Math.min(MAX_DRAWER_WIDTH, window.innerWidth);
    if (drawerWidth > maxAllowed) {
      setDrawerWidth(maxAllowed);
    }
  }, [drawerWidth, open]);

  useEffect(() => {
    const allSessions = sessionStore.getAllSessions();
    setSessions(allSessions);
    if (allSessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(allSessions[0].id);
    }
  }, [currentSessionId, sessionStore]);

  const refreshSessions = useCallback(() => {
    const allSessions = sessionStore.getAllSessions();
    setSessions(allSessions);
    if (currentSessionId) {
      const updatedSession = sessionStore.getSession(currentSessionId);
      if (updatedSession) {
        setCurrentSession({
          ...updatedSession,
          messages: [...updatedSession.messages],
        });
      }
    }
  }, [sessionStore, currentSessionId]);

  /**
   * Throttled version of refreshSessions for use during streaming.
   * Limits UI updates to once per UI_REFRESH_THROTTLE_MS to prevent freezing.
   */
  const throttledRefreshSessions = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastUiRefreshTimeRef.current;

    if (timeSinceLastRefresh >= UI_REFRESH_THROTTLE_MS) {
      // Enough time has passed, refresh immediately
      lastUiRefreshTimeRef.current = now;
      refreshSessions();
    } else {
      // Schedule a refresh at the end of the throttle period if not already scheduled
      if (pendingRefreshRef.current === null) {
        const delay = UI_REFRESH_THROTTLE_MS - timeSinceLastRefresh;
        pendingRefreshRef.current = setTimeout(() => {
          lastUiRefreshTimeRef.current = Date.now();
          pendingRefreshRef.current = null;
          refreshSessions();
        }, delay);
      }
    }
  }, [refreshSessions]);

  /**
   * Force an immediate refresh (used at end of streaming)
   */
  const flushRefresh = useCallback(() => {
    if (pendingRefreshRef.current !== null) {
      clearTimeout(pendingRefreshRef.current);
      pendingRefreshRef.current = null;
    }
    lastUiRefreshTimeRef.current = Date.now();
    refreshSessions();
  }, [refreshSessions]);

  const showDrawer = useCallback(() => {
    setOpen(true);
    const allSessions = sessionStore.getAllSessions();
    if (allSessions.length === 0) {
      const newSession = sessionStore.createSession();
      setCurrentSessionId(newSession.id);
      refreshSessions();
    }
  }, [sessionStore, refreshSessions]);


  const onClose = () => {
    setOpen(false);
  };


  const handleCreateSession = () => {
    const newSession = sessionStore.createSession();
    setCurrentSessionId(newSession.id);
    refreshSessions();
  };

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    sessionStore.deleteSession(sessionId);
    refreshSessions();
    if (currentSessionId === sessionId) {
      const updatedSessions = sessionStore.getAllSessions();
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        setCurrentSessionId(null);
      }
    }
  };

  const handleEdit = (
    targetKey: string | React.MouseEvent | React.KeyboardEvent,
    action: "add" | "remove",
  ) => {
    if (action === "remove" && typeof targetKey === "string") {
      handleDeleteSession(targetKey);
    }
  };

  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendToProvider = useCallback(
    async (sessionId: string, messages: ChatMessage[], attachmentUrls?: string[], newMessages?: ChatMessage[]) => {
      if (sendInProgressRef.current) {
        console.warn("[AiAssistant] sendToProvider skipped – already in progress");
        return;
      }
      if (messages.length === 0) {
        console.error("[AiAssistant] sendToProvider skipped – messages array is empty (would cause API 400)");
        setProviderError("Conversation is empty. Please type a message and try again.");
        return;
      }
      sendInProgressRef.current = true;
      console.log("[AiAssistant] sendToProvider called", {
        sessionId,
        messagesCount: messages.length,
        hasChainContext: !!chainContext,
        chainId: chainContext?.chain?.id,
        hasPageChainContext: !!pageChainContext,
      });
      let aiProvider: AiModelProvider | null = null;
      let currentProviderError: string | null = providerError;

      try {
        aiProvider = getDefaultAiProvider();
        if (currentProviderError) {
          setProviderError(null);
          currentProviderError = null;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to initialize AI provider";
        setProviderError(errorMsg);
        currentProviderError = errorMsg;
      }

      if (!aiProvider) {
        sendInProgressRef.current = false;
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: currentProviderError || "AI service is not configured.",
        };
                const finalMessages: ChatMessage[] = [...messages, errorMessage];
        sessionStore.updateSessionMessages(sessionId, finalMessages);
        refreshSessions();
        return;
      }

      setIsLoading(true);
      setIsStreaming(false);
      abortControllerRef.current = new AbortController();

      try {
        // Lightweight mode (with-progress): when conversationId is present, send only new messages;
        // the backend reconstructs history from the stored conversation.
        const currentSessionData = sessionStore.getSession(sessionId);
        const serverConversationId = currentSessionData?.conversationId;
        const messagesToApi = (serverConversationId && newMessages) ? newMessages : messages;

        const requestPayload: ChatRequest = {
          messages: messagesToApi,
          conversationId: serverConversationId,
          abortSignal: abortControllerRef.current.signal,
          attachmentUrls,
          temperature: 1
        };

        if (chainContext) {
          const { chain, compactSchema } = chainContext;
          requestPayload.context = {
            type: "chain",
            chainId: chain.id,
            compactSchema,
          };
          console.log("[AiAssistant] Added chain context to request", {
            chainId: chain.id,
            chainName: chain.name,
            elementsCount: compactSchema?.elements?.length || 0,
            connectionsCount: compactSchema?.connections?.length || 0,
          });
        } else {
          console.log("[AiAssistant] No chain context available");
        }

        const start = performance.now();
        console.log("[AiAssistant] Starting AI request", {
          supportsStreaming: aiProvider.capabilities.supportsStreaming,
          hasStreamChat: !!aiProvider.streamChat,
          hasChatWithProgress: !!aiProvider.chatWithProgress,
          messagesCount: messages.length,
        });

        if (aiProvider.capabilities.supportsStreaming && aiProvider.streamChat) {
          console.log("[AiAssistant] Starting streaming chat", {
            hasChainContext: !!chainContext,
            chainId: chainContext?.chain?.id,
          });
          setIsStreaming(true);

          let currentMessages: ChatMessage[] = [...messages];
          let currentAssistantContent = "";
          let lastRefreshTime = performance.now();
          const REFRESH_INTERVAL_MS = 2000;
          let chunkCount = 0;
          let assistantMessageAdded = false; // Track if we've added assistant message

          await aiProvider.streamChat(requestPayload, (chunk: StreamingChunk) => {
            chunkCount++;
            console.log(`[AiAssistant] Streaming chunk #${chunkCount}`, {
              type: chunk.type,
              hasContentDelta: !!chunk.contentDelta,
              contentDeltaLength: chunk.contentDelta?.length || 0,
              hasChainContext: !!chainContext,
            });

            if (chunk.type === "progress" && chunk.progressMessage) {
              const progressText = `\n\n> 💡 ${chunk.progressMessage}\n\n`;
              currentAssistantContent += progressText;
              streamingContentRef.current = currentAssistantContent;

              // Build updated messages - replace last assistant or add new one
              let updatedMessages: ChatMessage[];
              if (assistantMessageAdded) {
                updatedMessages = [
                  ...currentMessages.slice(0, -1),
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
              } else {
                updatedMessages = [
                  ...currentMessages,
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
                assistantMessageAdded = true;
              }
              currentMessages = updatedMessages;
              sessionStore.updateSessionMessages(sessionId, updatedMessages);
              refreshSessions();

              const container = scrollContainerRef.current;
              if (container && shouldAutoScrollRef.current) {
                container.scrollTop = container.scrollHeight;
              }

              if (chunk.progressMessage.includes(" - completed")) {
                const toolName = chunk.toolName || "";
                const progressMsg = chunk.progressMessage.toLowerCase();
                const isCreateChain =
                  toolName.includes("catalog.create_chain") || progressMsg.includes("creating chain");
                if (isCreateChain && typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("chains-list-refresh"));
                }
                const shouldRefresh =
                  chainContext &&
                  (toolName.includes("catalog.create_element") ||
                    toolName.includes("catalog.update_element") ||
                    toolName.includes("catalog.create_connection") ||
                    toolName.includes("catalog.delete_elements") ||
                    toolName.includes("catalog.delete_connections") ||
                    toolName.includes("catalog.transfer_element") ||
                    progressMsg.includes("creating element") ||
                    progressMsg.includes("updating element") ||
                    progressMsg.includes("creating connection") ||
                    progressMsg.includes("deleting elements") ||
                    progressMsg.includes("deleting connections") ||
                    progressMsg.includes("transferring element"));

                if (shouldRefresh) {
                  console.log("[AiAssistant] Progress message indicates chain modification completed, refreshing chain context and React Flow", {
                    toolName,
                    progressMessage: chunk.progressMessage,
                    chainId: chainContext.chain?.id,
                  });
                  void (async () => {
                    try {
                      if (chainContext?.refresh) {
                        await chainContext.refresh();
                      }
                      if (pageChainContext?.refresh) {
                        await pageChainContext.refresh();
                      }
                      if (typeof window !== "undefined" && chainContext.chain) {
                        console.log("[AiAssistant] Dispatching chain-updated event (progress) to update React Flow", {
                          chainId: chainContext.chain.id,
                        });
                        window.dispatchEvent(
                          new CustomEvent("chain-updated", { detail: chainContext.chain.id })
                        );
                      }
                    } catch (error) {
                      console.error("[AiAssistant] Failed to refresh chain context after progress", {
                        error: error instanceof Error ? error.message : error,
                        chainId: chainContext.chain?.id,
                      });
                    }
                  })();
                }
              }
            }

            if (chunk.type === "delta" && chunk.contentDelta) {
              currentAssistantContent += chunk.contentDelta;
              streamingContentRef.current = currentAssistantContent;

              // Build updated messages - replace last assistant or add new one
              let updatedMessages: ChatMessage[];
              if (assistantMessageAdded) {
                // Replace the last message (which is our assistant message)
                updatedMessages = [
                  ...currentMessages.slice(0, -1),
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
              } else {
                // First delta - add new assistant message
                updatedMessages = [
                  ...currentMessages,
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
                assistantMessageAdded = true;
              }
              // Update currentMessages to reflect the new state
              currentMessages = updatedMessages;

              sessionStore.updateSessionMessages(sessionId, updatedMessages);
              throttledRefreshSessions(); // Use throttled refresh for delta chunks

              const container = scrollContainerRef.current;
              if (container && shouldAutoScrollRef.current) {
                container.scrollTop = container.scrollHeight;
              }

              if (chainContext) {
                const now = performance.now();
                const timeSinceLastRefresh = now - lastRefreshTime;
                console.log("[AiAssistant] Checking periodic refresh", {
                  chainId: chainContext.chain?.id,
                  timeSinceLastRefresh: Math.round(timeSinceLastRefresh),
                  shouldRefresh: timeSinceLastRefresh >= REFRESH_INTERVAL_MS,
                  refreshInterval: REFRESH_INTERVAL_MS,
                });
                if (timeSinceLastRefresh >= REFRESH_INTERVAL_MS) {
                  console.log("[AiAssistant] ⚡ Periodic refresh during streaming - TRIGGERED", {
                    chainId: chainContext.chain?.id,
                    timeSinceLastRefresh: Math.round(timeSinceLastRefresh),
                    chunkCount,
                  });
                  lastRefreshTime = now;
                  void (async () => {
                    console.log("[AiAssistant] Executing periodic refresh", {
                      chainId: chainContext.chain?.id,
                      hasChainContextRefresh: !!chainContext?.refresh,
                      hasPageChainContextRefresh: !!pageChainContext?.refresh,
                    });
                    if (chainContext?.refresh) {
                      console.log("[AiAssistant] Calling chainContext.refresh()");
                      await chainContext.refresh();
                    }
                    if (pageChainContext?.refresh) {
                      console.log("[AiAssistant] Calling pageChainContext.refresh()");
                      await pageChainContext.refresh();
                    }
                    if (typeof window !== "undefined" && chainContext.chain) {
                      console.log("[AiAssistant] Dispatching chain-updated event (periodic)", {
                        chainId: chainContext.chain.id,
                      });
                      window.dispatchEvent(
                        new CustomEvent("chain-updated", { detail: chainContext.chain.id })
                      );
                    }
                  })();
                }
              } else {
                console.log("[AiAssistant] No chainContext, skipping periodic refresh check");
              }
            }

            if (chunk.type === "done") {
              const durationMs = Math.round(performance.now() - start);
              console.log("[AiAssistant] Streaming done", {
                durationMs,
                totalChunks: chunkCount,
                contentLength: currentAssistantContent.length,
                hasChainContext: !!chainContext,
                chainId: chainContext?.chain?.id,
              });

              // Build final messages - replace last assistant or add new one
              let finalMessages: ChatMessage[];
              if (assistantMessageAdded) {
                // Replace the last message (which is our assistant message)
                finalMessages = [
                  ...currentMessages.slice(0, -1),
                  { role: "assistant" as const, content: currentAssistantContent || "" },
                ];
              } else {
                // No deltas/progress received - add the assistant message now
                finalMessages = [
                  ...currentMessages,
                  { role: "assistant" as const, content: currentAssistantContent || "" },
                ];
              }

              if (chunk.usage || chunk.finishReason) {
                const meta = {
                  durationMs,
                  finishReason: chunk.finishReason,
                  usage: chunk.usage,
                };
                finalMessages.push({
                  role: "system",
                  content: `__META__${JSON.stringify(meta)}`,
                });
              }

              sessionStore.updateSessionMessages(sessionId, finalMessages);
              streamingContentRef.current = ""; // Clear streaming ref
              flushRefresh(); // Force immediate refresh on completion
              setIsStreaming(false);

              // Save server conversationId for lightweight mode on next turn
              // Note: streaming done chunks may carry conversationId if the server supports it
              if ((chunk as unknown as { conversationId?: string }).conversationId) {
                sessionStore.updateConversationId(sessionId, (chunk as unknown as { conversationId?: string }).conversationId!);
              }

              const proposal = tryParseChainModificationProposal(currentAssistantContent);
              if (proposal) {
                setPendingProposal(proposal);
                setIsConfirmationOpen(true);
              }

              if (chainContext) {
                void (async () => {
                  console.log("[AiAssistant] Streaming response done, refreshing chain context", {
                    chainId: chainContext.chain?.id,
                  });
                  if (chainContext?.refresh) {
                    await chainContext.refresh();
                  }
                  if (pageChainContext?.refresh) {
                    await pageChainContext.refresh();
                  }
                  if (typeof window !== "undefined" && chainContext.chain) {
                    console.log("[AiAssistant] Dispatching chain-updated event (streaming)", {
                      chainId: chainContext.chain.id,
                    });
                    window.dispatchEvent(
                      new CustomEvent("chain-updated", { detail: chainContext.chain.id })
                    );
                  }
                })();
              }
            }

            if (chunk.type === "error" && chunk.errorMessage) {
              console.error("[AiAssistant] Streaming error", {
                errorMessage: chunk.errorMessage,
                chunkCount,
                hasChainContext: !!chainContext,
              });
              const lower = chunk.errorMessage.toLowerCase();
              if (lower.includes("aborted") || lower.includes("cancelled")) {
                console.log("[AiAssistant] Streaming aborted/cancelled");
                setIsStreaming(false);
                return;
              }

          const errorMessage: ChatMessage = {
            role: "assistant",
            content: chunk.errorMessage,
          };
          const finalMessages: ChatMessage[] = [...messages, errorMessage];
              sessionStore.updateSessionMessages(sessionId, finalMessages);
              streamingContentRef.current = ""; // Clear streaming ref
              flushRefresh(); // Force immediate refresh on error
              setIsStreaming(false);
            }
          });
        } else if (aiProvider.chatWithProgress) {
          console.log("[AiAssistant] Using non-streaming chat with progress (live updates)", {
            hasChainContext: !!chainContext,
            chainId: chainContext?.chain?.id,
          });
          setIsStreaming(true);

          let currentMessages: ChatMessage[] = [...messages];
          let currentAssistantContent = "";
          let assistantMessageAdded = false;

          const handleProgressChunk = (chunk: StreamingChunk) => {
            if (chunk.type === "progress" && chunk.progressMessage) {
              const progressText = `\n\n> 💡 ${chunk.progressMessage}\n\n`;
              currentAssistantContent += progressText;
              let updatedMessages: ChatMessage[];
              if (assistantMessageAdded) {
                updatedMessages = [
                  ...currentMessages.slice(0, -1),
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
              } else {
                updatedMessages = [
                  ...currentMessages,
                  { role: "assistant" as const, content: currentAssistantContent },
                ];
                assistantMessageAdded = true;
              }
              currentMessages = updatedMessages;
              sessionStore.updateSessionMessages(sessionId, updatedMessages);
              refreshSessions();
              const container = scrollContainerRef.current;
              if (container && shouldAutoScrollRef.current) {
                container.scrollTop = container.scrollHeight;
              }
              if (chunk.progressMessage.includes(" - completed")) {
                const toolName = chunk.toolName || "";
                const progressMsg = chunk.progressMessage.toLowerCase();
                const isCreateChain =
                  toolName.includes("catalog.create_chain") || progressMsg.includes("creating chain");
                if (isCreateChain && typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("chains-list-refresh"));
                }
              }
            }
            if (chunk.type === "error" && chunk.errorMessage) {
              const errorMessage: ChatMessage = { role: "assistant", content: chunk.errorMessage };
              sessionStore.updateSessionMessages(sessionId, [...currentMessages, errorMessage]);
              refreshSessions();
            }
          };

          let response: ChatResponse;
          try {
            response = await aiProvider.chatWithProgress!(requestPayload, handleProgressChunk);
          } finally {
            setIsStreaming(false);
          }

          const durationMs = Math.round(performance.now() - start);
          console.log("[AiAssistant] Chat with progress completed", {
            durationMs,
            messagesCount: response.messages.length,
            hasChainContext: !!chainContext,
          });

          // Use backend's response so we preserve the first user message with injected content (Design document URL).
          // Always collapse to last assistant only to avoid duplicate plan bubbles / infinite "Execute plan".
          const responseTail = getResponseTail(messages, response.messages);
          const assistantInTail = responseTail.filter((m): m is ChatMessage => m.role === "assistant");
          const lastAssistantFromResponse = assistantInTail[assistantInTail.length - 1];
          const resp = response.messages || [];
          let next: ChatMessage[] =
            lastAssistantFromResponse
              ? [...resp.filter((m) => m.role !== "assistant"), lastAssistantFromResponse]
              : [...resp];
          next = next.filter((m) => m.role !== "tool");

          // Keep our accumulated progress (pending + completed) so Steps show the real current operation
          if (currentAssistantContent.trim() && next.length > 0) {
            const lastIdx = next.length - 1;
            const lastMsg = next[lastIdx];
            if (lastMsg?.role === "assistant" && typeof lastMsg.content === "string") {
              const responseContent = lastMsg.content;
              // Avoid duplicating: if response already has progress block, use as-is
              const alreadyHasProgress = responseContent.trimStart().startsWith("> 💡");
              let mergedContent: string;
              if (alreadyHasProgress) {
                mergedContent = responseContent;
              } else {
                const narrative = responseContent.replace(/^(\s*>\s*💡[^\n]+(?:\n|$))+/, "").trim();
                mergedContent = narrative ? `${currentAssistantContent.trim()}\n\n${narrative}` : currentAssistantContent.trim();
              }
              next = [
                ...next.slice(0, lastIdx),
                { ...lastMsg, content: mergedContent },
              ];
            }
          }
          if (response.usage || response.finishReason) {
            next.push({
              role: "system",
              content: `__META__${JSON.stringify({
                durationMs,
                finishReason: response.finishReason,
                usage: response.usage,
              })}`,
            });
          }
          // Don't overwrite session with empty: keeps full history for follow-up requests
          if (next.length > 0) {
            sessionStore.updateSessionMessages(sessionId, next);
            refreshSessions();
          }

          // Save server conversationId for lightweight mode on next turn
          if (response.conversationId) {
            sessionStore.updateConversationId(sessionId, response.conversationId);
          }

          const lastAssistant = next.slice().reverse().find((m) => m.role === "assistant");
          if (lastAssistant) {
            const proposal = tryParseChainModificationProposal(lastAssistant.content);
            if (proposal) {
              setPendingProposal(proposal);
              setIsConfirmationOpen(true);
            }
          }

          if (chainContext) {
            void (async () => {
              if (chainContext?.refresh) await chainContext.refresh();
              if (pageChainContext?.refresh) await pageChainContext.refresh();
              if (typeof window !== "undefined" && chainContext.chain) {
                window.dispatchEvent(
                  new CustomEvent("chain-updated", { detail: chainContext.chain.id })
                );
              }
            })();
          }
        } else {
          console.log("[AiAssistant] Using non-streaming chat (no progress)", {
            hasChainContext: !!chainContext,
            chainId: chainContext?.chain?.id,
          });
          const response = await aiProvider.chat(requestPayload);
          const durationMs = Math.round(performance.now() - start);
          console.log("[AiAssistant] Non-streaming chat completed", {
            durationMs,
            messagesCount: response.messages.length,
            hasChainContext: !!chainContext,
          });

          const responseTail = getResponseTail(messages, response.messages);
          const assistantMessages = responseTail.filter(
            (m): m is ChatMessage => m.role === "assistant",
          );

          // Only add the LAST assistant message to avoid duplicates
          // The server may return multiple assistant messages from intermediate tool calls,
          // but we only want to show the final response to the user
          const lastAssistant = assistantMessages[assistantMessages.length - 1];
          let next = lastAssistant ? [...messages, lastAssistant] : [...messages];
          next = next.filter((m) => m.role !== "tool");

          if (response.usage || response.finishReason) {
            const meta = {
              durationMs,
              finishReason: response.finishReason,
              usage: response.usage,
            };
            next.push({ role: "system", content: `__META__${JSON.stringify(meta)}` });
          }

          // Don't overwrite session with empty: keeps full history for follow-up requests
          if (next.length > 0) {
            sessionStore.updateSessionMessages(sessionId, next);
            refreshSessions();
          }

          // Save server conversationId for lightweight mode on next turn
          if (response.conversationId) {
            sessionStore.updateConversationId(sessionId, response.conversationId);
          }

          // Try to detect structured chain modification proposal in the last assistant message
          // (lastAssistant already defined above)
          if (lastAssistant) {
            const proposal = tryParseChainModificationProposal(lastAssistant.content);
            if (proposal) {
              setPendingProposal(proposal);
              setIsConfirmationOpen(true);
            }
          }

          if (chainContext) {
            void (async () => {
              console.log("[AiAssistant] Non-streaming response done, refreshing chain context", {
                chainId: chainContext.chain?.id,
              });
              if (chainContext?.refresh) {
                await chainContext.refresh();
              }
              if (pageChainContext?.refresh) {
                await pageChainContext.refresh();
              }
              if (typeof window !== "undefined" && chainContext.chain) {
                console.log("[AiAssistant] Dispatching chain-updated event (non-streaming)", {
                  chainId: chainContext.chain.id,
                });
                window.dispatchEvent(
                  new CustomEvent("chain-updated", { detail: chainContext.chain.id })
                );
              }
            })();
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to get AI response";
        const lower = message.toLowerCase();
        if (lower.includes("aborted") || lower.includes("cancelled")) {
          const session = sessionStore.getSession(sessionId);
          if (session) {
            sessionStore.updateSessionMessages(sessionId, [...messages]);
          }
          refreshSessions();
          return;
        }
        const errorMessage: ChatMessage = {
          role: "assistant",
          content:
            message,
        };
        const finalMessages = [...messages, errorMessage];
        sessionStore.updateSessionMessages(sessionId, finalMessages);
        refreshSessions();
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
        sendInProgressRef.current = false;
      }
    },
    [chainContext, providerError, refreshSessions, throttledRefreshSessions, flushRefresh, sessionStore],
  );

  // Note: handleRegenerate was replaced by more granular handleRegenerateFromIndex and is no longer needed.

  const handleSend = useCallback(async () => {
    const rawValue = inputValue || inputRef.current?.resizableTextArea?.textArea?.value || "";
    const messageText = rawValue.trim();
    if ((!messageText && attachedFiles.length === 0) || isLoading) return;

    const sessionId = currentSessionId ?? sessionStore.createSession().id;

    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }

    const session = sessionStore.getSession(sessionId);
    if (!session) return;

    let attachmentUrls: string[] | undefined;
    if (attachedFiles.length > 0) {
      try {
        const aiProvider = getDefaultAiProvider();
        if (aiProvider.uploadFile) {
          attachmentUrls = (
            await Promise.all(attachedFiles.map((file) => aiProvider.uploadFile!(file, sessionId)))
          ).map((r) => r.url);
        }
      } catch (e) {
        console.warn("[AiAssistant] Upload failed, sending without attachments", e);
      }
      setAttachedFiles([]);
    }

    const userContent = messageText || (attachmentUrls?.length ? "See attached files." : "");
    const userMessage: ChatMessage = { role: "user", content: userContent };
    const next = [...session.messages, userMessage];
    sessionStore.updateSessionMessages(sessionId, next);
    if (attachmentUrls?.length) {
      sessionStore.updateSessionLastAttachmentUrls(sessionId, attachmentUrls);
    }
    setInputValue("");
    refreshSessions();
    await sendToProvider(sessionId, next, attachmentUrls, [userMessage]);

    const after = sessionStore.getSession(sessionId);
    if (after && (after.title === "New Chat" || after.title.match(/^Chat \d+$/))) {
      const title = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? "..." : "");
      sessionStore.updateSessionTitle(sessionId, title);
      refreshSessions();
    }
  }, [currentSessionId, inputValue, inputRef, isLoading, attachedFiles, refreshSessions, sendToProvider, sessionStore]);

  const handleExecutePlanClick = useCallback(async () => {
    if (!currentSessionId || isLoading || isStreaming) return;
    const session = sessionStore.getSession(currentSessionId);
    if (!session) return;
    // Idempotent: do not send again if last user message is already Agree (avoids double-send / button reappearance)
    if (lastUserMessageIsAgree(session.messages)) return;
    const agreeMessage: ChatMessage = { role: "user", content: "Agree" };
    const next = [...session.messages, agreeMessage];
    sessionStore.updateSessionMessages(currentSessionId, next);
    refreshSessions();
    // Re-read session so we have latest lastAttachmentUrls (needed so backend can persist design URL in chain description)
    const latestSession = sessionStore.getSession(currentSessionId);
    let attachmentUrls = latestSession?.lastAttachmentUrls ?? session.lastAttachmentUrls;
    // If no attachment URLs were stored (e.g. design link only in assistant message), extract from messages
    if (!attachmentUrls?.length) {
      const designUrl = extractDesignUrlFromMessages(session.messages);
      if (designUrl) attachmentUrls = [designUrl];
    }
    await sendToProvider(currentSessionId, next, attachmentUrls, [agreeMessage]);
  }, [currentSessionId, isLoading, isStreaming, sessionStore, refreshSessions, sendToProvider]);

  const handleClear = useCallback(() => {
    if (isLoading || !currentSessionId) return;
    sessionStore.updateSessionMessages(currentSessionId, []);
    sessionStore.updateConversationId(currentSessionId, undefined);
    refreshSessions();
  }, [isLoading, currentSessionId, sessionStore, refreshSessions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    drawerWrapperRef.current = null;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;

        const element =
          drawerWrapperRef.current ||
          document.querySelector(".ai-assistant-drawer .ant-drawer-content-wrapper");

        const wrapper = element instanceof HTMLElement ? element : null;

        if (!wrapper) {
          return;
        }

        drawerWrapperRef.current = wrapper;

        const rect = wrapper.getBoundingClientRect();
        const rightEdge = rect.right;
        const newWidth = Math.round(rightEdge - e.clientX);

        if (newWidth < MIN_DRAWER_WIDTH || newWidth > MAX_DRAWER_WIDTH) {
          return;
        }

        drawerWidthRef.current = newWidth;
        setDrawerWidth(newWidth);
        wrapper.style.width = `${newWidth}px`;
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      safeStorageSet(DRAWER_WIDTH_STORAGE_KEY, drawerWidthRef.current.toString());

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isResizing]);

  const meta = useMemo(() => {
    const msgs = currentSession?.messages ?? [];
    const lastMeta = [...msgs].reverse().find((m) => m.role === "system" && m.content.startsWith("__META__"));
    if (!lastMeta) return null;
    return parseChatMeta(lastMeta.content.replace("__META__", ""));
  }, [currentSession?.messages]);

  // Memoized filtered messages - avoids re-filtering on every render
  const visibleMessages = useMemo(() => {
    return (currentSession?.messages ?? []).filter((m) => {
      if (m.role === "system" && m.content.startsWith("__META__")) return false;
      if (m.role === "assistant" && m.content.trim() === "No response from model") return false;
      return true;
    });
  }, [currentSession?.messages]);

  // Scroll to bottom when messages change or when last message content grows (e.g. progress chunks appended)
  const msgs = currentSession?.messages ?? [];
  const lastMessageContentLength = msgs.length > 0 ? (msgs[msgs.length - 1]?.content?.length ?? 0) : 0;
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollToBottom = () => {
      el.scrollTop = el.scrollHeight;
    };
    // Run after layout so new content is measured; rAF ensures scrollHeight is correct
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [currentSession?.messages?.length, lastMessageContentLength, open]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceToBottom < 80;
  }, []);

  const tabItems = sessions.map((session) => ({
    key: session.id,
    label: session.title,
    children: null,
  }));

  const handlePrepareRegenerateFromIndex = useCallback(
    (messageIndex: number) => {
      if (!currentSessionId) return;
      const session = sessionStore.getSession(currentSessionId);
      if (!session) return;

      const messages = session.messages;
      if (messageIndex < 0 || messageIndex >= messages.length) return;

      let lastUserIndex: number | undefined;
      for (let i = messageIndex; i >= 0; i -= 1) {
        if (messages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }

      if (lastUserIndex === undefined) {
        return;
      }

      const userMessage = messages[lastUserIndex];
      const baseMessages = messages.slice(0, lastUserIndex + 1);

      sessionStore.updateSessionMessages(currentSessionId, baseMessages);
      refreshSessions();
      setInputValue(userMessage.content);

      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    },
    [currentSessionId, refreshSessions, sessionStore],
  );

  const handleRegenerateFromIndex = useCallback(
    async (messageIndex: number) => {
      if (!currentSessionId || isLoading || isStreaming) return;
      const session = sessionStore.getSession(currentSessionId);
      if (!session) return;

      const messages = session.messages;
      if (messageIndex < 0 || messageIndex >= messages.length) return;

      let lastUserIndex: number | undefined;
      for (let i = messageIndex; i >= 0; i -= 1) {
        if (messages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }

      if (lastUserIndex === undefined) {
        return;
      }

      const baseMessages = messages.slice(0, lastUserIndex + 1);
      sessionStore.updateSessionMessages(currentSessionId, baseMessages);
      sessionStore.updateConversationId(currentSessionId, undefined);
      refreshSessions();
      await sendToProvider(currentSessionId, baseMessages);
    },
    [currentSessionId, isLoading, isStreaming, refreshSessions, sendToProvider, sessionStore],
  );

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          showDrawer();
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            e.stopPropagation();
            showDrawer();
          }
        }}
        style={{ display: "inline-block" }}
      >
        <Button
          type="text"
          aria-label={assistantName}
          title={assistantName}
          style={{
            fontSize: 18,
            color: "inherit",
          }}
          icon={<OverridableIcon name="comment" />}
          onClick={(e) => {
            e.stopPropagation();
            showDrawer();
          }}
        />
      </div>
      <Drawer
        title={
          <div style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500 }}>{assistantName}</span>
              <Space size="small">
                <Button size="small" icon={<OverridableIcon name="plus" />} onClick={handleCreateSession}>
                  New Chat
                </Button>
                <Button size="small" onClick={handleClear} disabled={isLoading || isStreaming}>
                  Clear
                </Button>
              </Space>
            </div>
          </div>
        }
        placement="right"
        open={open}
        closable={true}
        onClose={onClose}
        afterOpenChange={() => {}}
        width={drawerWidth}
        zIndex={2000}
        rootClassName="ai-assistant-drawer"
      >
        <div
          className={`ai-drawer-resize-handle ${isResizing ? "resizing" : ""}`}
          onMouseDown={handleMouseDown}
        />
        {sessions.length > 0 && currentSessionId && (
          <Tabs
            activeKey={currentSessionId}
            onChange={handleSessionChange}
            onEdit={handleEdit}
            items={tabItems}
            type="editable-card"
            hideAdd
            style={{ marginBottom: 6 }}
            size="small"
          />
        )}
        <div className="ai-chat-root">
          {providerError && (
            <Typography.Text type="danger" className="ai-provider-error">
              {providerError}
            </Typography.Text>
          )}

          {chainContext && (
            <div className="ai-context-pill">
              <span className="ai-context-pill__label">Chain:</span>
              <span className="ai-context-pill__value">{chainContext.chain.name}</span>
            </div>
          )}

          <div ref={scrollContainerRef} className="ai-message-list" onScroll={handleScroll}>
            {visibleMessages.length === 0 ? (
              <div className="ai-empty-state">
                <Typography.Text type="secondary">
                  Ask a question about QIP, chains, services, or elements.
                </Typography.Text>
              </div>
            ) : (
              <>
                {visibleMessages.map((message, index) => {
                  // Don't show empty assistant messages while streaming/loading
                  if (message.role === "assistant" && !message.content.trim() && (isLoading || isStreaming)) {
                    return null;
                  }

                  const isUser = message.role === "user";
                  const isRateLimitError = message.role === "assistant" &&
                    message.content.toLowerCase().includes("rate limit");
                  const rawLines = message.role === "assistant" ? parseProgressLines(message.content) : [];
                  let progressLines = message.role === "assistant" ? collapseProgressLines(rawLines) : [];
                  const isLastAssistant = index === visibleMessages.length - 1 && message.role === "assistant";
                  if (isLastAssistant && (isLoading || isStreaming)) {
                    const lastLine = progressLines[progressLines.length - 1];
                    const alreadyHasPending = lastLine?.status === "pending";
                    if (!alreadyHasPending) {
                      progressLines = [...progressLines, { text: `Working${WORKING_DOTS[workingDots]}`, status: "pending" as ProgressLineStatus }];
                    }
                  }
                  const hasProgressLog = progressLines.length > 0;
                  let narrativeContent = message.role === "assistant" ? stripProgressBlocks(message.content) : message.content;
                  if (message.role === "assistant") {
                    narrativeContent = stripInlineProgressSummary(narrativeContent);
                    narrativeContent = replaceChainModificationProposalForDisplay(narrativeContent);
                  }

                  return (
                    <div
                      key={message.id || `msg-${index}`}
                      className={`ai-message ai-message--${message.role}`}
                    >
                      <div className="ai-message__meta">
                        <span className="ai-message__role">{getRoleLabel(message.role, assistantName)}</span>
                      </div>
                      <div className="ai-message__bubble">
                        {hasProgressLog && (
                          <ExecutionLog lines={progressLines} title="Steps" defaultCollapsed={false} />
                        )}
                        {narrativeContent.trim() ? (
                          <MarkdownRenderer>{narrativeContent}</MarkdownRenderer>
                        ) : null}

                        {message.role === "assistant" &&
                          index === visibleMessages.length - 1 &&
                          !isLoading &&
                          !isStreaming &&
                          looksLikePlanResponse(message.content) &&
                          !lastUserMessageIsAgree(visibleMessages) && (
                          <div className="ai-message__plan-actions" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--vscode-border, #eee)" }}>
                            <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
                              Ready to execute?
                            </Typography.Text>
                            <Button
                              type="primary"
                              size="middle"
                              onClick={() => void handleExecutePlanClick()}
                            >
                              Execute plan
                            </Button>
                          </div>
                        )}
                        {message.role === "assistant" &&
                          index === visibleMessages.length - 1 &&
                          !isLoading &&
                          !isStreaming &&
                          looksLikeValidationResult(message.content) &&
                          chainContext?.chain?.id && (
                          <div className="ai-message__plan-actions" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--vscode-border, #eee)" }}>
                            <Button
                              type="primary"
                              size="middle"
                              onClick={() => { window.location.href = `/chains/${chainContext.chain!.id}/sessions`; }}
                            >
                              Go to Sessions
                            </Button>
                          </div>
                        )}
                        {isUser && (
                          <div className="ai-message__actions">
                            <Tooltip title="Edit message and send again">
                              <Button
                                size="small"
                                type="text"
                                icon={<OverridableIcon name="edit" />}
                                onClick={() => handlePrepareRegenerateFromIndex(index)}
                              />
                            </Tooltip>
                            <Tooltip title="Regenerate from this answer">
                              <Button
                                size="small"
                                type="text"
                                icon={<OverridableIcon name="redo" className="ai-icon-rotate-vertical" />}
                                onClick={() => void handleRegenerateFromIndex(index)}
                              />
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(isLoading || isStreaming) && (() => {
                  const lastMessage = visibleMessages[visibleMessages.length - 1];
                  // Show "Thinking..." only if last message is from user (assistant hasn't started responding yet)
                  // or if last assistant message is empty
                  const shouldShowThinking = lastMessage?.role === "user" ||
                    (lastMessage?.role === "assistant" && !lastMessage.content.trim());
                  if (shouldShowThinking) {
                    return (
                      <div className="ai-message ai-message--assistant">
                        <div className="ai-message__meta">
                          <span className="ai-message__role">{getRoleLabel("assistant", assistantName)}</span>
                        </div>
                        <div className="ai-message__bubble">
                          <Typography.Text type="secondary" style={{ fontStyle: "italic" }}>
                            {showLongRunningHint
                              ? "Working… (this may take a minute)"
                              : "Thinking"}
                            <span className="ai-thinking-dots">
                              <span className="ai-thinking-dot ai-thinking-dot--1">.</span>
                              <span className="ai-thinking-dot ai-thinking-dot--2">.</span>
                              <span className="ai-thinking-dot ai-thinking-dot--3">.</span>
                            </span>
                          </Typography.Text>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            )}
          </div>

          <Divider className="ai-divider" />

          <div className="ai-input">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".txt,.md,.json,.csv,.pdf,text/plain,application/json,text/markdown,text/csv,application/pdf,image/png,image/jpeg,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                const limit = 5;
                const maxSize = 10 * 1024 * 1024;
                const valid = files.filter((f) => f.size <= maxSize).slice(0, limit);
                setAttachedFiles((prev) => [...prev, ...valid].slice(0, limit));
                e.target.value = "";
              }}
            />
            {attachedFiles.length > 0 && (
              <div className="ai-input__attachments" style={{ marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {attachedFiles.map((file, i) => (
                  <span
                    key={`${file.name}-${i}`}
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      background: "var(--vscode-badge-background, #eee)",
                      borderRadius: 4,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {file.name}
                    <Button
                      type="text"
                      size="small"
                      style={{ padding: 0, minWidth: 20 }}
                      icon={<OverridableIcon name="close" />}
                      onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Remove attachment"
                    />
                  </span>
                ))}
              </div>
            )}
            <Input.TextArea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              rows={INPUT_TEXTAREA_ROWS}
              disabled={isLoading || isStreaming}
              onKeyDown={(e) => {
                if (e.key === SEND_KEY && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <div className="ai-input__actions">
              <Space size="small">
                <Tooltip title="Attach file">
                  <Button
                    type="text"
                    size="small"
                    icon={<OverridableIcon name="paperClip" />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isStreaming}
                    aria-label="Attach file"
                  />
                </Tooltip>
                {meta?.usage?.totalTokens ? (
                  <Typography.Text type="secondary" className="ai-meta">
                    Tokens: {meta.usage.totalTokens} · {meta.durationMs}ms
                  </Typography.Text>
                ) : null}
                <Button
                  type="primary"
                  className={isLoading || isStreaming ? "ai-send-button ai-send-button--loading" : "ai-send-button"}
                  onClick={() => {
                    if (isLoading || isStreaming) {
                      handleAbort();
                    } else {
                      void handleSend();
                    }
                  }}
                >
                  {(isLoading || isStreaming) && (
                    <OverridableIcon name="redo" style={{ marginRight: 6 }} />
                  )}
                  {isLoading || isStreaming ? "Abort" : "Send"}
                </Button>
              </Space>
            </div>
          </div>
        </div>
        <ChainModificationConfirmation
          open={isConfirmationOpen}
          proposal={pendingProposal}
          onCancel={() => setIsConfirmationOpen(false)}
          onApply={(proposal) => {
            void (async () => {
              if (!chainContext) {
                setIsConfirmationOpen(false);
                return;
              }
              try {
                const chainId = proposal.chainId || chainContext.chain.id;

                // Apply changes using existing REST API.
                // Creation of elements is already performed by the AI service via MCP tools.
                // For createElement actions we only apply provided properties to the newly created element.
                for (const change of proposal.changes) {
                  switch (change.action) {
                    case "updateChain":
                      await api.updateChain(chainId, change.patch);
                      break;
                    case "createElement": {
                      const { type, properties } = change.request;
                      if (properties && Object.keys(properties).length > 0) {
                        const elements = await api.getElementsByType(chainId, type);
                        if (elements.length > 0) {
                          let target = elements[0];
                          if (elements.length > 1 && type === "http-trigger") {
                            const candidate = elements.find((el) => {
                              const props = (el as any).properties as Record<string, unknown> | undefined;
                              return !props || props.contextPath === undefined;
                            });
                            if (candidate) {
                              target = candidate;
                            }
                          }
                          const currentProps =
                            ((target as any).properties as Record<string, unknown> | undefined) || {};
                          const mergedProps = {
                            ...currentProps,
                            ...properties,
                          };
                          await api.updateElement(
                            {
                              name: target.name,
                              description: (target as any).description || "",
                              type: target.type,
                              parentElementId: (target as any).parentElementId,
                              properties: mergedProps,
                            },
                            chainId,
                            target.id,
                          );
                        }
                      }
                      break;
                    }
                    case "updateElement":
                      await api.updateElement(change.patch, chainId, change.elementId);
                      break;
                    case "deleteElements":
                      await api.deleteElements(change.elementIds, chainId);
                      break;
                    case "createConnection":
                      await api.createConnection(change.connection, chainId);
                      break;
                    case "deleteConnections":
                      await api.deleteConnections(change.connectionIds, chainId);
                      break;
                    default:
                      console.warn("[AI] Unknown chain modification action", change);
                  }
                }

                // Refresh chain contexts after successful changes
                // 1. Refresh AI's chain context
                if (chainContext?.refresh) {
                  await chainContext.refresh();
                }

                // 2. Refresh page-level chain context (used by ChainGraph and other components)
                if (pageChainContext?.refresh) {
                  await pageChainContext.refresh();
                }

                // 3. Dispatch custom event to notify other components (e.g., ChainGraph)
                // This ensures components that don't use ChainContext also get updated
                if (typeof window !== "undefined") {
                  console.log("[AiAssistant] Dispatching chain-updated event (after applying changes)", {
                    chainId: chainId,
                    changesCount: proposal.changes.length,
                  });
                  window.dispatchEvent(
                    new CustomEvent("chain-updated", { detail: chainId })
                  );
                }
              } catch (error) {
                console.error("[Ai] Failed to apply chain modifications", error);
              } finally {
                setIsConfirmationOpen(false);
                setPendingProposal(null);
              }
            })();
          }}
        />
      </Drawer>
    </>
  );
};

function tryParseChainModificationProposal(content: string): ChainModificationProposal | null {
  // Expect JSON somewhere in the message with type === "chain-modification-proposal"
  const marker = '"type":"chain-modification-proposal"';
  const idx = content.indexOf(marker);
  if (idx === -1) return null;

  // Try to find the opening brace before marker
  const start = content.lastIndexOf("{", idx);
  if (start === -1) return null;

  // Parse progressively increasing slices until JSON.parse succeeds or fail fast
  for (let end = content.length; end > start + marker.length; end--) {
    const slice = content.slice(start, end);
    try {
      const parsed: unknown = JSON.parse(slice);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed as { type?: unknown }).type === "chain-modification-proposal"
      ) {
        return parsed as ChainModificationProposal;
      }
    } catch {
      // ignore and try shorter slice
    }
  }

  return null;
}



