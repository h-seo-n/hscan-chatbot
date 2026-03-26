import { create } from "zustand";
import type { ChatMessage, A2UIBlock } from "./types";

/** ------ chat state ------- */
interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  // action functions
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistant: (patch: Partial<ChatMessage>) => void;
  attachA2UI: (messageId: string, block: A2UIBlock) => void;
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

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

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
        m.id === messageId ? { ...m, a2ui: block } : m
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  clearMessages: () => set({ messages: [] }),
}));
