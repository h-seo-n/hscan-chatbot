import type { A2UIBlock } from "./a2uiSchema";

/** -------- LLM ------ */
export type LLMRequestMessage =
  | {
      role: "user" | "system";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
      tool_calls?: {
          id: string;
          type: "function";
          function: { name: string; arguments: string; }
        }[];
      }
  | {
    role: "tool";
    tool_call_id: string;
    content: string;
  }
    
    ;

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  /** 원본 응답 (디버깅용) */
  raw?: unknown;
}

/** ----- 채팅 관련 types ----- */
export interface ToolCall {
  id: string; // 고유 id
  name: string; // tool 이름
  arguments: Record<string, unknown>; // tool 사용 시 필요한 정보들
}

export interface ToolResult {
  toolCallId: string;
  content: unknown;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[]; // tool 요청 내역 (only for role==="assistant")
  toolResult?: ToolResult; // tool 실행 결과 (only for role==="system")
  a2uiBlocks: A2UIBlock[]; // A2UI를 활용한 dynamic block : LLM 응답 파싱 후 클라이언트 단에서 첨부
  timestamp: number;
  hidden?: boolean; // ui에는 보이지 않지만 llm에게 전달됨
  streaming?: boolean; // streaming 형태로 llm에게 응답을 받는지의 여부 (대부분 true)
  aborted?: boolean; // 중간에 중단했는지
}

/** ------ MCP Client ------ */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // mcp protocol always garuntees it is always valid - no need to map / check
}

export interface McpCallToolRequest {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface McpCallToolResponse {
  content: unknown;
  isError?: boolean | unknown;
}

/** Logger */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}