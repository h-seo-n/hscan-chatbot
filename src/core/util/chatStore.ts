import { create } from "zustand";
import type { ChatMessage, ToolCall } from "./types/generalTypes";
import type { A2UIBlock } from "./types/a2uiSchema";

/** ------ chat state ------- */
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  // action functions
  addMessage: (msg: ChatMessage) => void;
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
      messages: s.messages.map((m) =>
        m.id === messageId 
          ? { ...m, a2uiBlocks: [...(m.a2uiBlocks ?? []), block] } 
          : m
      ),
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
        m.id === id ? { ...m, streaming: false } : m,
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
