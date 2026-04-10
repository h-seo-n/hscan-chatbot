/** -------- LLM ------ */
export interface LLMRequestMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

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

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[]; // tool 요청 내역 (only for role==="assistant")
  toolResult?: ToolResult; // tool 실행 결과 (only for role==="system")
  a2ui?: A2UIBlock; // A2UI를 활용한 dynamic block : LLM 응답 파싱 후 클라이언트 단에서 첨부
  timestamp: number;
}

export interface Image {
  id: string;
  title: string;
  hospital: string;
  capturedAt: string;
  thumbnailUrl?: string;
}


/** ------ MCP Client ------ */

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpCallToolRequest {
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface McpCallToolResponse {
  content: unknown;
  isError?: boolean;
}



/** ---------- A2UI 관련 types ---------- */
export type A2UIType =
  // TODO : 무슨 UI block 종류 있는지 다 넣기
  | "hospital-selector"
  | "video-selector"
  | "payment"
  | "confirmation"
  | "info-card";

export interface A2UIBlock {
  type: A2UIType;
  // 각 A2UI 컴포넌트에 전달될 props
  props: Record<string, unknown>;
}
