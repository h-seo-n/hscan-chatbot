import type {
  AccessTokenProvider,
  LLMRequestMessage,
  LLMResponse,
  McpToolDefinition,
  ToolCall,
} from "../util/types/generalTypes";
import type { A2UIBlock } from "../util/types/a2uiSchema";
import type { Logger } from "../util/types/generalTypes";
import { A2UIStreamParser, parseA2UI, type A2UIParseError } from "./parser";

export interface LLMClientConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  authTokenProvider?: AccessTokenProvider;
  logger?: Logger;
  // 재시도 파라미터
  maxRetries?: number;
  initialBackoffMs?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 500;


/** ------ 공통 유틸 --------- */
/** 상태 코드별 에러 타입 구분
 * -> 에러에 따라 caller에서 사용자에게 다른 메시지 보여줌
 */
export class LLMError extends Error {
  readonly kind:
    | "auth" // 401/403 - API key 문제
    | "rate-limit" // 429
    | "server" // 5xx
    | "client" // 4xx (auth/rate-limit 제외)
    | "network" // fetch 실패
    | "parse"; // 응답 JSON 파싱 실패
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    message: string,
    kind: LLMError["kind"],
    status?: number,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "LLMError";
    this.kind = kind;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function classifyStatus(status: number): LLMError["kind"] {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate-limit";
  if (status >= 500) return "server";
  return "client";
}

function isRetryable(err: LLMError): boolean {
  return err.kind === "rate-limit" || err.kind === "server" || err.kind === "network";
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  // HTTP-date 형식
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return undefined;
}

/**
 * exponential backoff + jitter : 몇 초 후 retry할지 결정 + 랜덤한 Jitter을 더해서 동시 retry의 충돌 방지
 */
async function backoff(
  attempt: number,
  initialMs: number,
  retryAfterMs: number | undefined,
): Promise<void> {
  const base = retryAfterMs ?? initialMs *2 ** attempt;
  const jitter = Math.random() * initialMs;
  await new Promise((r) => setTimeout(r, base + jitter));
}

/**
 * convert tools to OpenAI function-calling format
 */
function toOpenAITools(tools: McpToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    }
  }));
}

function buildRequestHeaders(config: LLMClientConfig, acceptStream = false): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const bearerToken = config.apiKey || config.authTokenProvider?.();
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  if (acceptStream) {
    headers.Accept = "text/event-stream";
  }

  return headers;
}

/**
 * OpenAI non-streaming 호출
 */
export interface CallLLMResult extends LLMResponse {
  // parsed a2ui info : caller -> renderer 전달
  a2uiBlocks: A2UIBlock[];
  a2uiErrors: A2UIParseError[];
  // pure text w/o A2UI
  text: string;
}

export async function callLLM(
  messages: LLMRequestMessage[],
  config: LLMClientConfig,
  tools?: McpToolDefinition[],
): Promise<CallLLMResult> {
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const initialBackoff = config.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = toOpenAITools(tools);
  }

  let lastError: LLMError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(config.baseUrl, {
        method: "POST",
        headers: buildRequestHeaders(config),
        body: JSON.stringify(body),
      });

      // llm error
      if (!res.ok) {
        const kind = classifyStatus(res.status);
        const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
        const errorBody = await res.text().catch(() => "");
        const err = new LLMError(
          `LLM API error: ${res.status} ${res.statusText} ${errorBody}`,
          kind,
          res.status,
          retryAfterMs,
        );

        if (isRetryable(err) && attempt < maxRetries) {
          config.logger?.warn("LLM 호출 재시도", {
            attempt: attempt + 1,
            kind,
            status: res.status,
          });
          lastError = err;
          await backoff(attempt, initialBackoff, retryAfterMs);
          continue;
        }
        throw err;
      }

      const data = await res.json();
      const choice = data.choices?.[0];

      const toolCalls: ToolCall[] | undefined = choice?.message?.tool_calls?.map(
          (tc: {id: string; function: { name: string; arguments: string } }) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: safeParseJSON(tc.function.arguments, config.logger),
          }),
      );

      const rawResponse: LLMResponse = {
        content: choice?.message?.content ?? "",
        toolCalls: toolCalls?.length ? toolCalls : undefined,
        raw: data,
      };

      // A2UI parsing 통합
      const { text, a2uiBlocks, errors } = parseA2UI(rawResponse, {
        logger: config.logger,
      });

      return {
        ...rawResponse,
        text,
        a2uiBlocks,
        a2uiErrors: errors,
      };
    } catch (e) {
      // fetch failure (network issue etc.)
      if (e instanceof LLMError) throw e;
      const err = new LLMError(
        e instanceof Error ? e.message : "unknown network error",
        "network",
      );
      if (attempt < maxRetries) {
        config.logger?.warn("네트워크 오류 - 재시도", { attempt: attempt + 1});
        lastError = err;
        await backoff(attempt, initialBackoff, undefined);
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new LLMError("LLM 호출 실패 (재시도 소진)", "network");
}

function safeParseJSON(raw: string, logger?: Logger): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch (e) {
    logger?.warn("tool_call arguments JSON 파싱 실패", {
      raw,
      error: e instanceof Error ? e.message : String(e),
    });
    return {};
  }
}

/**
 * ------------------OpenAI streaming 호출------------------
 */
export interface CallLLMStreamHandlers {
  // text handler
  onText?: (chunk: string) => void;
  // A2UI block 완성 시 호출
  onBlock?: (block: A2UIBlock, index: number) => void;
  // A2UI 파싱 실패 시 호출 (JSON 오류 / 스키마 위반 / 미완성)
  onA2UIError?: (error: A2UIParseError) => void;
  // stream 종료 후 tool_calls 전달
  onToolCalls?: (toolCalls: ToolCall[]) => void;
  // stream 정상 종료
  onDone?: (summary: {
    fullText: string;
    a2uiBlocks: A2UIBlock[];
    toolCalls: ToolCall[];
  }) => void;
  // stream 에러 때문에 종료
  onError?: (error: LLMError) => void;
}

/**
 * SSE streaming 호출
 * - text, a2ui block : A2UIStreamParser로 실시간으로 렌더링(emit)
 * - tool_calls: delta로 들어오는 arguments를 버퍼링, [DONE] 시점에 한꺼번에 emit???
 * 
 * AbortController로 중단 가능
 */
export async function callLLMStream(
  messages: LLMRequestMessage[],
  config: LLMClientConfig,
  handlers: CallLLMStreamHandlers,
  options: {
    tools?: McpToolDefinition[];
    signal?: AbortSignal;
  } = {},
): Promise<void> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    stream: true,
  };

  if (options.tools && options.tools.length > 0) {
    body.tools = toOpenAITools(options.tools);
  }

  // accumulated state
  let fullText = "";
  const a2uiBlocks: A2UIBlock[] = [];

  // tool_call: index별로 argument 문자열을 이어붙임
  const toolCallBuffers = new Map<
    number,
    { id?: string; name?: string; arguments: string }
  >();

  const a2uiParser = new A2UIStreamParser({
    logger: config.logger,
    onText: (chunk) => {
      fullText += chunk;
      handlers.onText?.(chunk);
    },
    onBlock: (block, index) => {
      a2uiBlocks.push(block);
      handlers.onBlock?.(block, index);
    },
    onError: (err) => {
      handlers.onA2UIError?.(err);
    },
  });

  let res: Response;

  try {
    res = await fetch(config.baseUrl, {
      method: "POST",
      headers: buildRequestHeaders(config, true),
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (e) {
    const err = new LLMError(
      e instanceof Error ? e.message : "네트워크 오류",
      "network",
    );
    handlers.onError?.(err);
    throw err;
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    const err = new LLMError(
      `LLM stream error: ${res.status} ${res.statusText} ${errorBody}`,
      classifyStatus(res.status),
      res.status,
      parseRetryAfter(res.headers.get("retry-after")),
    );
    handlers.onError?.(err);
    throw err;
  }

  if (!res.body) {
    const err = new LLMError("응답 body 없음", "parse");
    handlers.onError?.(err);
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });

      // \n\n 기준으로 완성된 이벤트 분리
      let boundary = sseBuffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = sseBuffer.slice(0, boundary);
        sseBuffer = sseBuffer.slice(boundary + 2);
        processSSEEvent(rawEvent, a2uiParser, toolCallBuffers, config.logger);
        boundary = sseBuffer.indexOf("\n\n"); // next event boundary
      }
    }

    // stream end - A2UI 파서 정리
    a2uiParser.flush();

    // tool_calls 조립
    const toolCalls: ToolCall[] = Array.from(toolCallBuffers.entries())
      .sort(([a], [b]) => a - b)
      .filter(([, buf]) => buf.id && buf.name)
      .map(([, buf]) => ({
        id: buf.id!,
        name: buf.name!,
        arguments: safeParseJSON(buf.arguments, config.logger),
      }));

      if (toolCalls.length > 0) {
        handlers.onToolCalls?.(toolCalls);
      }

      handlers.onDone?.({ fullText, a2uiBlocks, toolCalls });
  } catch (e) {
    // AbortError : 사용자가 의도적으로 중단한 경우
    if (e instanceof DOMException && e.name === "AbortError") {
      config.logger?.debug("LLM 스트림 중단 (abort)");
      a2uiParser.flush();
      return;
    }
    const err =
      e instanceof LLMError
        ? e
        : new LLMError(
            e instanceof Error ? e.message : "스트림 처리 실패",
            "network",
        );
    handlers.onError?.(err);
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/** helper: 단일 SSE event parsing -> A2UI parser / tool call buffer에 배분
 *  
 * * OpenAI SSE 포맷:
 *   data: {"choices":[{"delta":{"content":"Hello"}}]}
 *   data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"lo"}}]}}]}
 *   data: [DONE]
 */
function processSSEEvent(
  rawEvent: string,
  a2uiParser: A2UIStreamParser,
  toolCallBuffers: Map<number, { id?: string; name?: string; arguments: string }>,
  logger?: Logger,
): void {
  // event의 각 줄에서 "data: "" prefix 제거
  const dataLines = rawEvent
    .split("\n")
    .filter((line) => line.slice(6).trim())
    .map((line) => line.slice(6).trim());

  for (const data of dataLines) {
    if (data === "[DONE]") return;
    if (!data) continue;

    let parsed: any;
    try {
      parsed = JSON.parse(data);
    } catch (e) {
      logger?.warn("SSE JSON 파싱 실패 - 이벤트 스킵", { data });
      continue;
    }

    const delta = parsed.choices?.[0]?.delta;
    if (!delta) continue;

    // 1. text content
    if (typeof delta.content === "string" && delta.content.length > 0) {
      a2uiParser.push(delta.content);
    }

    // 2. tool calls - arguments가 token 단위로 전달
    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx: number = tc.index;
        if (typeof idx !== "number") continue;

        const buf = toolCallBuffers.get(idx) ?? { arguments: "" };
        if (tc.id) buf.id = tc.id;
        if (tc.function?.name) buf.name = tc.function.name;
        if (typeof tc.function?.arguments === "string") {
          buf.arguments += tc.function.arguments;
        }
        toolCallBuffers.set(idx, buf);
      }
    }
  }

}
