import { McpClient } from "./mcp/mcpClient";
import { callLLM } from "./llm/client";
import { buildSystemPrompt } from "./llm/prompts";
import { parseA2UI, hasToolCalls } from "./llm/parser";
import { useChatStore, generateId } from "./util/chatStore";
import type {
  ChatMessage,
  LLMRequestMessage,
  McpToolDefinition,
} from "./util/types";

/**
 *   1. 사용자 메시지를 받아 LLM API를 호출한다  (LLM caller)
 *   2. LLM이 tool_call을 반환하면 MCP 서버로 전달한다 (MCP client)
 *   3. tool 실행 결과를 다시 LLM에 넘겨 최종 응답을 생성한다
 *   4. 응답에서 A2UI 블록을 파싱하여 ChatMessage에 첨부한다
 *
 * TODO: API 키 관리 방식 결정 (env / 사용자 입력 / 백엔드 프록시)
 * TODO: 스트리밍 응답 처리 (SSE → 점진적 UI 업데이트)
 * TODO: tool_call → tool_result → LLM 재호출 루프 최대 횟수 제한
 * TODO: 에러 발생 시 사용자에게 안내 메시지 표시
 */
export class Orchestrator {
  private mcpClient: McpClient;
  private tools: McpToolDefinition[] = [];
  private apiKey: string;

  constructor(apiKey: string) {
    this.mcpClient = new McpClient();
    this.apiKey = apiKey;
  }

  /** 초기화: MCP 서버 연결 & tool 목록 로드 */
  async init(): Promise<void> {
    await this.mcpClient.connect();
    this.tools = await this.mcpClient.listTools();
    console.log("[Orchestrator] initialized with tools:", this.tools.map((t) => t.name));
  }

  /**
   * 사용자 메시지를 처리하는 메인 루프.
   *
   * Flow:
   *   userMessage → LLM → (tool_call?) → MCP → LLM → ... → assistantMessage
   */
  async handleUserMessage(userText: string): Promise<void> {
    const store = useChatStore.getState();

    // 1. 사용자 메시지를 store에 추가
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };
    store.addMessage(userMsg);
    store.setLoading(true);

    try {
      // 2. 대화 이력을 LLM 요청 형식으로 변환
      const llmMessages = this.buildLLMMessages();

      // 3. LLM 호출
      // TODO: tools를 OpenAI function calling 형식으로 변환
      const llmResponse = await callLLM(llmMessages, this.apiKey);

      // 4. tool_call이 있으면 MCP 서버로 전달 후 재호출
      if (hasToolCalls(llmResponse)) {
        // TODO: tool_call 루프 구현
        //   - 각 tool_call에 대해 mcpClient.callTool() 호출
        //   - 결과를 tool role 메시지로 추가
        //   - LLM 재호출하여 최종 텍스트 응답 획득
        //   - 최대 반복 횟수 제한 (무한 루프 방지)
        console.log("[Orchestrator] tool calls detected:", llmResponse.toolCalls);
      }

      // 5. A2UI 블록 파싱
      const { text, a2ui } = parseA2UI(llmResponse);

      // 6. assistant 메시지를 store에 추가
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: text,
        a2ui,
        timestamp: Date.now(),
      };
      store.addMessage(assistantMsg);
    } catch (error) {
      console.error("[Orchestrator] error:", error);
      // TODO: 에러 메시지를 사용자에게 표시
      store.addMessage({
        id: generateId(),
        role: "assistant",
        content: "죄송합니다. 요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.",
        timestamp: Date.now(),
      });
    } finally {
      store.setLoading(false);
    }
  }

  /**
   * store의 메시지 이력을 LLM API 요청 형식으로 변환한다.
   */
  private buildLLMMessages(): LLMRequestMessage[] {
    const systemPrompt = buildSystemPrompt(this.tools);
    const history = useChatStore.getState().messages;

    const messages: LLMRequestMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
      // TODO: tool role 메시지도 변환하여 포함
    }

    return messages;
  }

  /** 정리: MCP 연결 종료 */
  async destroy(): Promise<void> {
    await this.mcpClient.disconnect();
  }
}
