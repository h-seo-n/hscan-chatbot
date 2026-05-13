import { McpClient } from "./mcp/mcpClient";
import { callLLMStream, type LLMClientConfig } from "./llm/client";
import { buildSystemPrompt } from "./llm/prompts";
import { useChatStore, generateId } from "./util/chatStore";

import type {
  ChatMessage,
  LLMRequestMessage,
  McpToolDefinition,
  Logger,
  ToolCall,
  AccessTokenProvider
} from "./util/types/generalTypes";


/**
 *   1. 사용자 메시지를 받아 LLM API를 호출한다  (LLM caller)
 *   2. LLM이 tool_call을 반환하면 MCP 서버로 전달한다 (MCP client)
 *   3. tool 실행 결과를 다시 LLM에 넘겨 최종 응답을 생성한다
 *   4. 응답에서 A2UI 블록을 파싱하여 ChatMessage에 첨부한다
 *
 */
export class Orchestrator {
  private mcpClient: McpClient;
  private tools: McpToolDefinition[] = [];
  private llmConfig: LLMClientConfig;
  private logger?: Logger;
  private currentAbort?: AbortController;

  private static readonly MAX_LOOP = 5;

  constructor(config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    logger?: Logger;
    getAccessToken: AccessTokenProvider;
  }) {
    this.mcpClient = new McpClient({
      getAccessToken: config.getAccessToken,
    });
    this.llmConfig = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      logger: config.logger,
    };
    this.logger = config.logger;
  }

  /** 초기화: MCP 서버 연결 & tool 목록 로드 */
  async init(): Promise<void> {
    try {
      await this.mcpClient.connect();
      this.tools = await this.mcpClient.listTools();
    } catch (error) {
      this.tools = [];
      this.logger?.warn("MCP 서버 연결 실패 - 도구 없이 계속 진행", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    this.logger?.debug("Orchestrator Initialized", {
      tools: this.tools.map((t) => t.name),
    });
  }

  /** LLM만 볼 수 있는 context message */
  addHiddenMessage(userText: string, options?: { hidden?: boolean }): void {
    useChatStore.getState().addMessage({
      id: generateId(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
      hidden: options?.hidden ?? true,
    });
  }

  /** 진행중인 요청 중단 */
  abort(): void {
    this.currentAbort?.abort();
  }

  /**
   * 사용자 메시지 처리 메인 루프
   *
   * 각 iteration에서 callLLMStream
   * -> tool_call 있으면 실행 후 다음 iteration
   */
  async handleUserMessage(
    userText: string, 
    options?: { hidden?: boolean }
  ): Promise<void> {
    const store = useChatStore.getState();

    // 1. 사용자 메시지를 store에 추가
    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
      hidden: options?.hidden,
    };
    store.addMessage(userMsg);
    store.setLoading(true);

    this.currentAbort = new AbortController();

    try {
      let loop = 0;
      while (loop < Orchestrator.MAX_LOOP) {
        const iterationResult = await this.runStreamIteration(
          this.currentAbort.signal,
        );

        if (iterationResult.toolCalls.length === 0) {
          // tool_call 없으면 루프 종료
          return;
        }
      
        // tool call 있음 : 실행 -> 결과를 store에 기록
        // 다음 iteration에서 buildLLMMessages가 tool call 반영
        await this.executeToolCalls(iterationResult.toolCalls);
        loop += 1;
      }

      this.logger?.warn("Agent loop 최대 반복 도달");
      store.addMessage({
        id: generateId(),
        role: "assistant",
        content: "요청이 너무 복잡합니다. 조금 더 구체적으로 알려주세요.",
        timestamp: Date.now(),
      });
    
    } catch (error) {
      this.handleError(error);
    } finally {
      store.setLoading(false);
      this.currentAbort = undefined;
    }
  }

  /**
   * 한번의 llm stream 호출 + 업데이트
   * - text/block : chatStore에 반영
   * - tool_calls : 반환 (stream 끝나면 실행)
   */
  private async runStreamIteration (
    signal: AbortSignal,
  ): Promise<{ toolCalls: ToolCall[]; assistantMessageId: string }> {
    const store = useChatStore.getState();
    const messages = this.buildLLMMessages();

    // 비어있는 assistant message 추가
    const assistantMessageId = generateId();
    store.addMessage({
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    });

    let collectedToolCalls: ToolCall[] = [];

    await callLLMStream(
      messages,
      this.llmConfig,
      {
        onText: (chunk) => {
          useChatStore.getState().appendToMessage(assistantMessageId, chunk);
        },
        onBlock: (block) => {
          useChatStore.getState().attachA2UI(assistantMessageId, block);
        },
        onA2UIError: (err) => {
          this.logger?.warn("A2UI 블록 렌더링 실패", {
            reason: err.reason,
            detail: err.detail,
          });
        },
        onToolCalls: (calls) => {
          collectedToolCalls = calls;
          useChatStore.getState().setToolCalls(assistantMessageId, calls);
        },
        onDone: () => {
          useChatStore.getState().markStreamingDone(assistantMessageId);
        },
        onError: (err) => {
          this.logger?.error("LLM Stream Error", {
            kind: err.kind,
            status: err.status,
          });
        },
      },
      { tools: this.tools, signal },
    );

    return { toolCalls: collectedToolCalls, assistantMessageId }
  }

  /** 
   * helper: stream 이후 모인 tool_calls를 순차적으로 store에 기록 -> 실행
   */
  private async executeToolCalls(toolCalls: ToolCall[]): Promise<void> {
    const store = useChatStore.getState();

    for (const tc of toolCalls) {
      this.logger?.debug("tool 실행", {name: tc.name});
      try {
        // tool 실행 후 결과 받아옴
        const result = await this.mcpClient.callTool({
          toolName: tc.name,
          arguments: tc.arguments,
        });
        store.addMessage({
          id: generateId(),
          role: "tool",
          content:
            typeof result.content === "string"
              ? result.content
              : JSON.stringify(result.content),
          toolResult: { toolCallId: tc.id, content: result.content },
          timestamp: Date.now(),
          hidden: true,
        });
      } catch (e) {
        this.logger?.warn("Tool 실행 실패", {
          name: tc.name,
          error: e instanceof Error ? e.message : String(e),
        });
        store.addMessage({
          id: generateId(),
          role: "tool",
          content: JSON.stringify({
            error: true,
            message: e instanceof Error ? e.message : "tool 실행 실패",
          }),
          toolResult: {
            toolCallId: tc.id,
            content: { error: true },
          },
          timestamp: Date.now(),
          hidden: true,
        })
      }
    }
  }

  /**
   * helper: 에러 종류에 따라 사용자에게 다른 메시지 표시
   */
  private handleError(error: unknown): void {
    const store = useChatStore.getState();

    // abort - 정상적인 흐름, 에러 x -> 메시지 표시 x
    if (error instanceof DOMException && error.name === "AbortError") {
      this.logger?.debug("요청 중단됨");
      return;
    }

    let userMessage = "죄송합니다, 요청 처리 중 오류가 발생했습니다.";

    if (error instanceof Error && "kind" in error) {
      const kind = (error as { kind: string }).kind;
      switch (kind) {
        case "auth":
          userMessage = "인증에 문제가 발생했습니다. 관리자에게 문의해주세요.";
          break;
        case "rate-limit":
          userMessage = "요청이 많아 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
        case "server":
          userMessage = "서버에 일시적인 문제가 있습니다. 다시 시도해주세요.";
          break;
        case "network":
          userMessage = "네트워크 연결을 확인해주세요.";
          break;        
        }
    }

    this.logger?.error("Orchestrator 에러", {
      error: error instanceof Error ? error.message : String(error),
    });

    store.addMessage({
      id: generateId(),
      role: "assistant",
      content: userMessage,
      timestamp: Date.now(),
    });    
  }



  /**
   * helper : store의 메시지 이력을 LLM API 요청 형식으로 변환
   */
  private buildLLMMessages(): LLMRequestMessage[] {
    const systemPrompt = buildSystemPrompt(this.tools);
    const history = useChatStore.getState().messages;

    const messages: LLMRequestMessage[] = [
      { role: "system", content: systemPrompt },
    ];

    for (const msg of history) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        const assistantMsg: LLMRequestMessage = {
          role: "assistant",
          content: msg.content,
        };
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          (assistantMsg as LLMRequestMessage & {
            tool_calls: unknown[];
          }).tool_calls = msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }
        messages.push(assistantMsg);
      } else if (msg.role=== "tool" && msg.toolResult) {
        messages.push({
          role: "tool",
          tool_call_id: msg.toolResult.toolCallId,
          content:
            typeof msg.toolResult.content === "string"
              ? msg.toolResult.content
              : JSON.stringify(msg.toolResult.content),
        });
      }
    }

    return messages;
  }

  /** 정리: MCP 연결 종료 */
  async destroy(): Promise<void> {
    await this.mcpClient.disconnect();
  }
}
