import { create } from "zustand";
import type { ChatMessage, ToolCall } from "./types/generalTypes";
import type { A2UIBlock } from "./types/a2uiSchema";

/** ------ chat state ------- */
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  // action functions
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, chunk: string) => void;
  updateLastAssistant: (patch: Partial<ChatMessage>) => void;
  attachA2UI: (messageId: string, block: A2UIBlock) => void;
  setToolCalls: (id: string, toolCalls: ToolCall[]) => void;
  markStreamingDone: (id: string) => void;
  markStreamingAborted: (id: string) => void;
  setLoading: (v: boolean) => void;
  clearMessages: () => void;
}

/** ------ id generation ------- */
let _seq = 0;
export const generateId = () => `msg-${Date.now()}-${_seq++}`;

const normalizeContent = (content: string): string => {
  const paragraphs = content
    .trim()
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length > 0 && paragraphs.length % 2 === 0) {
    const half = paragraphs.length / 2;
    const firstHalf = paragraphs.slice(0, half).join("\n\n");
    const secondHalf = paragraphs.slice(half).join("\n\n");
    if (firstHalf === secondHalf) return firstHalf;
  }

  return content;
};

const blockKey = (block: A2UIBlock): string => JSON.stringify(block);

const dedupeBlocks = (blocks: A2UIBlock[] | undefined): A2UIBlock[] | undefined => {
  if (!blocks) return undefined;

  const seen = new Set<string>();
  const deduped = blocks.filter((block) => {
    const key = blockKey(block);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
};


/** -------- Hook for storing chats ------- */
export const useChatStore = create<ChatState>((set) => ({
  // total chat message history
  messages: [],
  isLoading: false,
  a2uiBlocks: [],
  streaming: true,

  // 채팅 화면에서 보여줄 하나의 완전한 채팅메시지
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    })),

  // 기존에 있는 채팅 메시지에 text 덩어리들을 append
  appendToMessage: (id, chunk) => 
    set((s) => ({
      messages: s.messages.map((m) => 
        m.id === id ? { ...m, content: m.content + chunk } : m
      ), 
    })),

  updateLastAssistant: (patch) =>
    set((s) => {
      const msgs = [...s.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") {
          msgs[i] = { ...msgs[i], ...patch };
          break;
        }
      }
      return { messages: msgs };
    }),

  attachA2UI: (messageId, block) =>
    set((s) => ({
      messages: s.messages.map((m) => {
        if (m.id !== messageId) return m;
        const existingBlocks = m.a2uiBlocks ?? [];
        if (existingBlocks.some((existing) => blockKey(existing) === blockKey(block))) {
          return m;
        }
        return { ...m, a2uiBlocks: [...existingBlocks, block] };
      }),
    })),

  // 한 stream 이후 tool_calls를 메시지에 기록
  setToolCalls: (id, toolCalls) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, toolCalls } : m,
      ),
    })),

  markStreamingDone: (id) => 
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id
          ? {
              ...m,
              content: normalizeContent(m.content),
              a2uiBlocks: dedupeBlocks(m.a2uiBlocks),
              streaming: false,
            }
          : m,
      ),
    })), 

  markStreamingAborted: (id) => 
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, aborted: true } : m,
    ),
    })),
    
  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),
}));
