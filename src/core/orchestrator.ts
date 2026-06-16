import { McpClient } from "./mcp/mcpClient";
import { callLLMStream, type LLMClientConfig } from "./llm/client";
import { buildSystemPrompt } from "./llm/prompts";
import { useChatStore, generateId } from "./util/chatStore";
import { useCaseStore } from "./util/caseStore";
import { useHospitalStore } from "./util/hospitalStore";
import { usePaymentStore, extractStudyPayment } from "./util/paymentStore";

import type {
  ChatMessage,
  LLMRequestMessage,
  McpToolDefinition,
  Logger,
  ToolCall,
  AccessTokenProvider
} from "./util/types/generalTypes";
import { CaseSchema, type Case } from "./util/types/caseTypes";


/**
 * MCP tool 결과에서 cases 배열을 추출한다.
 * - structuredContent shape: { cases: Case[], total?: number }
 * - 기본 content shape: [{ type: "text", text: "<stringified JSON>" }]
 *
 * 추출 후 CaseSchema로 파싱하여 누락된 필드(contentIds, bodyPart 등)에 default를 적용한다.
 * 잘못된 case는 버리고 나머지를 반환한다.
 */
function extractCasesFromToolResult(content: unknown): Case[] | null {
  const raw = extractRawCases(content);
  if (!raw) return null;

  const parsed: Case[] = [];
  for (const item of raw) {
    const result = CaseSchema.safeParse(normalizeCaseItem(item));
    if (result.success) {
      parsed.push(result.data);
    } else {
      console.warn("[Orchestrator] case 항목 파싱 실패 - skip", {
        item,
        issues: result.error.issues,
      });
    }
  }
  return parsed;
}

function extractRawCases(content: unknown): unknown[] | null {
  // getImageList 류는 { cases }, getImageByHospital 류는 { result } 로 배열을 돌려준다.
  const pickArray = (obj: Record<string, unknown>): unknown[] | null => {
    if (Array.isArray(obj.cases)) return obj.cases;
    if (Array.isArray(obj.result)) return obj.result;
    return null;
  };

  if (content && typeof content === "object" && !Array.isArray(content)) {
    const arr = pickArray(content as Record<string, unknown>);
    if (arr) return arr;
  }

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === "object" && "text" in block) {
        try {
          const inner = JSON.parse((block as { text: string }).text);
          if (inner && typeof inner === "object") {
            const arr = pickArray(inner as Record<string, unknown>);
            if (arr) return arr;
          }
        } catch {
          // not JSON — skip
        }
      }
    }
  }

  return null;
}

/**
 * 영상 목록 tool 결과의 개별 항목을 CaseSchema가 파싱할 수 있는 형태로 정규화한다.
 *
 * getImageByHospital 처럼 아직 사용자 계정으로 가져오지 않은 병원 영상은
 * caseId가 없고, modality 대신 modalities 배열을, studyDate 대신 date를 쓰며
 * studyDescription이 null 일 수 있다. 이를 Case 형태로 매핑한다.
 * (studyInstanceUID를 caseId로 사용 — 선택/조회의 식별자로 쓰인다.)
 */
function normalizeCaseItem(item: unknown): unknown {
  if (!item || typeof item !== "object" || Array.isArray(item)) return item;
  const rec = item as Record<string, unknown>;

  // 이미 Case 형태(caseId 보유)면 그대로 둔다.
  if (typeof rec.caseId === "string" && rec.caseId.length > 0) return item;

  // 병원 영상 검색 결과 형태: studyInstanceUID 기반
  if (typeof rec.studyInstanceUID === "string" && rec.studyInstanceUID.length > 0) {
    const modalities = Array.isArray(rec.modalities) ? rec.modalities : [];
    return {
      ...rec,
      caseId: rec.studyInstanceUID,
      studyDate: typeof rec.date === "string" ? rec.date : (rec.studyDate ?? ""),
      modality: typeof modalities[0] === "string" ? modalities[0] : undefined,
      studyDescription: rec.studyDescription ?? "",
    };
  }

  return item;
}

interface DownloadInfo {
  downloadUrl: string;
  fileName?: string;
}

const A2UI_RUNTIME_REMINDER = [
  "응답 직전 A2UI 점검:",
  "사용자가 선택, 동의, 입력, 결제, 목록 조회처럼 조작할 UI가 필요한 단계를 요청했다면 텍스트만 출력하지 말고 반드시 해당 A2UI 블록을 같은 응답에 포함하세요.",
  "사용자의 짧은 긍정 답변(응/네/좋아/진행해/해줘)은 직전 assistant 질문의 승인으로 해석하고, 승인 후 다음 단계가 A2UI라면 즉시 그 A2UI를 출력하세요.",
  "직전 질문이 제휴 병원에서 영상 가져오기 여부였고 사용자가 긍정했다면 hospital-selector(purpose: issue-source)를 출력하세요.",
  "긴 대화 뒤 새 시나리오를 시작하거나 다른 시나리오로 전환하는 경우에도 새 시나리오의 첫 A2UI 컴포넌트를 새로 출력해야 합니다.",
  "단순히 의도가 불명확해서 되묻는 clarification 질문만 A2UI 없이 텍스트로 답하세요.",
].join(" ");

function appendRenderedA2UIHistory(
  content: string,
  a2uiBlocks: ChatMessage["a2uiBlocks"],
): string {
  if (!a2uiBlocks || a2uiBlocks.length === 0) return content;

  const renderedTypes = a2uiBlocks.map((block) => block.type).join(", ");
  const suffix = `[이전 assistant 응답에서 실제 렌더링된 A2UI: ${renderedTypes}]`;
  return content ? `${content}\n\n${suffix}` : suffix;
}

/**
 * downloadImage tool 결과에서 다운로드 정보를 추출한다.
 * 서버는 downloadUrl(과 fileName)을 돌려주고, 실제 다운로드는 클라이언트가
 * 이 URL을 열어야 발생한다 (Content-Disposition: attachment).
 *
 * 지원 shape:
 * - { downloadUrl, fileName }
 * - { downloads: [{ downloadUrl, fileName }, ...] } (여러 영상)
 * - [{ type: "text", text: "<stringified JSON>" }]
 */
function extractDownloadInfos(content: unknown): DownloadInfo[] {
  const fromObject = (obj: unknown): DownloadInfo[] => {
    if (!obj || typeof obj !== "object") return [];
    const rec = obj as Record<string, unknown>;

    if (typeof rec.downloadUrl === "string") {
      return [
        {
          downloadUrl: rec.downloadUrl,
          fileName: typeof rec.fileName === "string" ? rec.fileName : undefined,
        },
      ];
    }

    if (Array.isArray(rec.downloads)) {
      return rec.downloads.flatMap(fromObject);
    }

    return [];
  };

  const direct = fromObject(content);
  if (direct.length > 0) return direct;

  if (Array.isArray(content)) {
    const collected: DownloadInfo[] = [];
    for (const block of content) {
      if (block && typeof block === "object" && "text" in block) {
        try {
          collected.push(...fromObject(JSON.parse((block as { text: string }).text)));
        } catch {
          // not JSON — skip
        }
      }
    }
    return collected;
  }

  return [];
}

/**
 * 브라우저에서 실제 다운로드를 트리거한다.
 * Content-Disposition: attachment 응답이므로 페이지 이동 없이 곧바로 다운로드된다.
 */
function triggerBrowserDownload({ downloadUrl, fileName }: DownloadInfo): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  if (fileName) anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

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
    apiKey?: string;
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
      authTokenProvider: config.getAccessToken,
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

    if (store.isLoading || this.currentAbort) {
      this.logger?.warn("이미 처리 중인 사용자 요청이 있어 새 요청을 무시합니다.");
      return;
    }

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
          console.warn("[Orchestrator] A2UI 블록 파싱/검증 실패", {
            reason: err.reason,
            detail: err.detail,
            raw: err.raw,
          });
          this.logger?.warn("A2UI 블록 렌더링 실패", {
            reason: err.reason,
            detail: err.detail,
          });
        },
        onToolCalls: (calls) => {
          collectedToolCalls = calls;
          const chatStore = useChatStore.getState();
          chatStore.setToolCalls(assistantMessageId, calls);
          chatStore.updateMessage(assistantMessageId, { hidden: true });
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
        const blockedDestinationLookup = this.getBlockedDestinationHospitalLookupMessage(tc);
        if (blockedDestinationLookup) {
          this.logger?.warn("목적지 병원 영상 조회 차단", {
            name: tc.name,
            arguments: tc.arguments,
          });
          store.addMessage({
            id: generateId(),
            role: "tool",
            content: JSON.stringify({
              error: true,
              message: blockedDestinationLookup,
            }),
            toolResult: {
              toolCallId: tc.id,
              content: {
                error: true,
                message: blockedDestinationLookup,
              },
            },
            timestamp: Date.now(),
            hidden: true,
          });
          continue;
        }

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

        // MCP tool 결과에 cases 배열이 있으면 caseStore에 hydrate
        // -> A2UIRenderer가 props.cases 없이도 컴포넌트를 렌더링할 수 있게 함
        const cases = extractCasesFromToolResult(result.content);
        console.log("[Orchestrator] tool result", {
          tool: tc.name,
          rawContent: result.content,
          extractedCases: cases?.length ?? 0,
        });
        if (cases && cases.length > 0) {
          useCaseStore.getState().setCases(cases);
          console.log("[Orchestrator] caseStore hydrated", {
            tool: tc.name,
            count: cases.length,
            firstCaseId: cases[0]?.caseId,
          });
        }

        if (tc.name === "getImageByHospital") {
          const hospitalName = tc.arguments.hospitalName;
          if (typeof hospitalName === "string" && hospitalName.trim().length > 0) {
            const hospitalStore = useHospitalStore.getState();
            if (!hospitalStore.issueSourceHospital) {
              hospitalStore.setIssueSourceHospital({
                id: "",
                name: hospitalName.trim(),
              });
            }
          }
        }

        // requestImage 결과는 결제 정보(결제 id + 금액)만 담고 있다.
        // paymentStore에 보관해 두면 결제 팝업에서 결제 완료 API 호출에 쓸 수 있다.
        if (tc.name === "requestImage") {
          const payment = extractStudyPayment(result.content);
          console.log("[Orchestrator] requestImage result", {
            tool: tc.name,
            paymentId: payment?.id ?? null,
          });
          if (payment) {
            usePaymentStore.getState().setPayment(payment);
          }
        }

        // downloadImage 결과의 downloadUrl을 받아 실제 브라우저 다운로드를 트리거
        if (tc.name === "downloadImage") {
          const downloads = extractDownloadInfos(result.content);
          console.log("[Orchestrator] downloadImage result", {
            tool: tc.name,
            downloadCount: downloads.length,
          });
          for (const info of downloads) {
            triggerBrowserDownload(info);
          }
        }
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

  private getBlockedDestinationHospitalLookupMessage(tc: ToolCall): string | null {
    if (tc.name !== "getImageByHospital") return null;

    const requestedHospitalName = tc.arguments.hospitalName;
    if (typeof requestedHospitalName !== "string") return null;

    const normalizedRequested = requestedHospitalName.trim();
    if (!normalizedRequested) return null;

    const hospitalStore = useHospitalStore.getState();
    const sourceHospital = hospitalStore.issueSourceHospital ?? hospitalStore.hospital;
    const destinationHospital = hospitalStore.sendDestinationHospital;
    const selectedCases = useCaseStore.getState().selectedCases;

    if (
      sourceHospital &&
      destinationHospital &&
      selectedCases.length > 0 &&
      sourceHospital.name !== destinationHospital.name &&
      normalizedRequested === destinationHospital.name
    ) {
      return [
        `${destinationHospital.name}은 영상을 가져올 병원이 아니라 보낼 목적지 병원입니다.`,
        `이미 ${sourceHospital.name}에서 가져올 영상 ${selectedCases.length}건이 선택되어 있으므로 목적지 병원에 대해 getImageByHospital을 호출하지 마세요.`,
        "다음 응답에는 추가 영상 선택 없이 purchase-imaging A2UI를 출력하세요.",
      ].join(" ");
    }

    return null;
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
        const hasToolCalls = !!msg.toolCalls && msg.toolCalls.length > 0;
        const assistantMsg: LLMRequestMessage = {
          role: "assistant",
          content: hasToolCalls ? "" : appendRenderedA2UIHistory(msg.content, msg.a2uiBlocks),
        };
        if (hasToolCalls) {
          (assistantMsg as LLMRequestMessage & {
            tool_calls: unknown[];
          }).tool_calls = msg.toolCalls!.map((tc) => ({
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

    messages.push({ role: "system", content: A2UI_RUNTIME_REMINDER });

    return messages;
  }

  /** 정리: MCP 연결 종료 */
  async destroy(): Promise<void> {
    await this.mcpClient.disconnect();
  }
}
