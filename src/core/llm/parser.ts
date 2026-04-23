import type { LLMResponse, Logger } from "../util/types/generalTypes";
import { A2UIBlockSchema, type A2UIBlock } from "../util/types/a2uiSchema";
import z from "zod";

/**
 * LLM 응답에서 A2UI 블록을 추출한다.
 *
 * LLM이 텍스트 응답 안에 JSON 형태의 A2UI 블록을 포함시킨 경우,
 * 이를 파싱하여 별도의 A2UIBlock 객체로 분리한다.
*/

export interface ParseA2UIResult {
  text: string;
  a2uiBlocks: A2UIBlock[];
  errors: A2UIParseError[];
}

export interface A2UIParseError {
  raw: string;
  reason: "json" | "schema" | "incomplete";
  detail: string;
  index: number;
}

// 열고 닫는 태그 정규식 — 속성(id, version 등) 허용
const A2UI_OPEN_TAG = /<a2ui(?:\s[^>]*)?>/;
const A2UI_BLOCK_REGEX = /<a2ui(?:\s[^>]*)?>([\s\S]*?)<\/a2ui>/g;

/**
 * 완성된 LLM 응답에서 A2UI 블록을 파싱
 * (비스트리밍용 — 한 번에 모든 블록 처리)
 */
export function parseA2UI(
  response: LLMResponse,
  options: { logger?: Logger } = {},  
): ParseA2UIResult {
  const logger = options.logger;
  const content = response.content;
  const a2uiBlocks: A2UIBlock[] = [];
  const errors: A2UIParseError[] = [];
  let blockIndex = 0;

  // A2UI 블록을 ```a2ui ... ``` 패턴으로 추출 시도
  const matches = Array.from(content.matchAll(A2UI_BLOCK_REGEX));

  for (const match of matches) {
    const rawJson = match[1].trim();
    const result = parseBlock(rawJson, blockIndex);

    if (result.ok) {
      a2uiBlocks.push(result.block);
    } else {
      errors.push(result.error);
      logger?.warn("A2UI 블록 파싱 실패", {
        reason: result.error.reason,
        detail: result.error.detail,
        index: blockIndex,
      });
    }
    blockIndex++;
  }
  // 성공 / 실패 raw data 모두 원본 텍스트에서 제거 -> raw json이 사용자에게 노출되지 않도록
  const text = content.replace(A2UI_BLOCK_REGEX, "").trim();

  return { text, a2uiBlocks, errors };
}

/**
 * 단일 블록의 JSON + schema 검증
*/
function parseBlock(
  rawJson: string,
  index: number,
):
  | { ok: true; block: A2UIBlock }
  | { ok: false; error: A2UIParseError } {

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (e) {
    return {
      ok: false,
      error: {
        raw: rawJson,
        reason: "json",
        detail: e instanceof Error ? e.message : "unknown JSON error",
        index,
      },
    };
  }

  const validation = A2UIBlockSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        raw: rawJson,
        reason: "schema",
        detail: z.prettifyError(validation.error),
        index,
      },
    };
  }

  return { ok: true, block: validation.data };
}

/**
 * 스트리밍 A2UI 파서
 * 완성된 A2UI block -> onBlock()으로 emit
 * 일반 text -> onText()로 emit
 * 
 * 사용 예시 : 
 *  const streamer = new A2UIStreamParser({ onText, onBlock, onError, logger });
 *  for await (const chunk of llmStream) streamer.push(chunk);
 *  streamer.flush();
 */
export interface A2UIStreamHandlers {
  onText?: (text: string) => void;
  onBlock?: (block: A2UIBlock, index: number) => void;
  onError?: (error: A2UIParseError) => void;
  logger?: Logger;
}

export class A2UIStreamParser {
  private buffer = "";
  private blockIndex = 0;
  // 현재 a2ui 블록 내부에 있는지 여부
  private insideBlock = false;
  private handlers: A2UIStreamHandlers;

  constructor(handlers: A2UIStreamHandlers = {}) {
    this.handlers = handlers;
  }

  /**
   * stream에서 들어온 chunk를 버퍼에 추가 -> 파싱 시도
   */
  push(chunk: string): void {
    this.buffer += chunk;
    this.drain();
  }

  /**
   * stream 끝난 후 호출해서 남은 버퍼 정리
   * -> 미완성 블록 남아있으면 incomplete 에러 emit해야함
   */
  flush(): void {
    if (this.insideBlock) {
      // 에러 : 블록에 진입했는데 닫는 태그가 없음
      const error: A2UIParseError = {
        raw: this.buffer,
        reason: "incomplete",
        detail: "스트림 종료 시점에 </a2ui> 닫는 태그가 도착하지 않음",
        index: this.blockIndex,
      };
      this.handlers.onError?.(error);
      this.handlers.logger?.warn("미완성 A2UI 블록 폐기", {
        bufferLength: this.buffer.length,
        index: this.blockIndex,
      });
      this.buffer = "";
      this.insideBlock = false;
      return;
    }
    // 에러 없는 경우, 블록 외부 남은 텍스트 그대로 emit
    if (this.buffer.length > 0) {
      this.handlers.onText?.(this.buffer);
      this.buffer = "";
    }
  }

  /**
   * 버퍼에 있는 string들을 가능한만큼 consume 후,
   * 텍스트/블록으로 변환하며 방출
   */
  private drain(): void {
    while (true) {
      if (!this.insideBlock) {
        // a2ui block 여는 태그 있는지 보기
        const openMatch = this.buffer.match(A2UI_OPEN_TAG);

        if (!openMatch || openMatch.index === undefined) {
          // 여는 태그가 없으면, '<' 직전까지 텍스트로 분류
          const safeEnd = this.findSafeTextBoundary(this.buffer);
          if (safeEnd > 0) {
            this.handlers.onText?.(this.buffer.slice(0, safeEnd));
            this.buffer = this.buffer.slice(safeEnd);
          }
          return;
        }

        // 여는 태그 이전까지의 텍스트 emit
        if (openMatch.index > 0) {
          this.handlers.onText?.(this.buffer.slice(0, openMatch.index));
        }
        // 버퍼에서 '여는 태그 포함 이전 부분' 제거
        this.buffer = this.buffer.slice(openMatch.index + openMatch[0].length);
        this.insideBlock = true;
      }

      // 블록 내부 : 닫는 태그 '</a2ui>' 찾기
      const closeIdx = this.buffer.indexOf("</a2ui>");
      // 블록 미완성이면 다음 chunk 기다림
      if (closeIdx === -1) return;

      const rawJson = this.buffer.slice(0, closeIdx).trim();
      this.buffer = this.buffer.slice(closeIdx + "</a2ui>".length);
      this.insideBlock = false;

      const result = parseBlock(rawJson, this.blockIndex);
      if (result.ok) {
        this.handlers.onBlock?.(result.block, this.blockIndex);
      } else {
        this.handlers.onError?.(result.error);
        this.handlers.logger?.warn("A2UI 스트림 블록 파싱 실패", {
          reason: result.error.reason,
          detail: result.error.detail,
          index: this.blockIndex,
        });
      } 
      this.blockIndex++;
      // 버퍼에 다음 블록/텍스트가 남아있을 수 있으니 계속
    }
  }

  /**
   * 텍스트 구간 경계를 찾는 헬퍼함수: '<' 문자 직전까지가 안전하게 텍스트로 분류 후 emit 가능한 경계
   */
  private findSafeTextBoundary(text: string): number {
    const lastIdx = text.lastIndexOf("<");
    // '<'가 텍스트 안에 없음
    if (lastIdx === -1) return text.length;

    // '<'가 텍스트 안에 있음 - '<' 이후 문자열이 "<a2ui"의 prefix일 가능성 있음
    const tail = text.slice(lastIdx); // '<' 이후 문자열
    if ("<a2ui".startsWith(tail)) return lastIdx;

    // "<" 로 시작하지만 a2ui 태그가 아님이 확실함
    return text.length;
  }
}

/**
 * LLM 응답에서 tool_calls 존재 여부를 판별한다.
 */
export function hasToolCalls(response: LLMResponse): boolean {
  return !!response.toolCalls && response.toolCalls.length > 0;
}
