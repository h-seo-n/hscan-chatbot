import type { A2UIBlock, LLMResponse } from "../util/types";

/**
 * LLM 응답에서 A2UI 블록을 추출한다.
 *
 * LLM이 텍스트 응답 안에 JSON 형태의 A2UI 블록을 포함시킨 경우,
 * 이를 파싱하여 별도의 A2UIBlock 객체로 분리한다.
 *
 * TODO: A2UI 블록 마커 포맷 확정 (예: ```a2ui ... ``` 또는 <a2ui>...</a2ui>)
 * TODO: 여러 개의 A2UI 블록이 포함된 경우 처리
 * TODO: 파싱 실패 시 fallback (텍스트로 그대로 표시)
 */
export function parseA2UI(response: LLMResponse): {
  text: string;
  a2ui?: A2UIBlock;
} {
  const content = response.content;

  // A2UI 블록을 ```a2ui ... ``` 패턴으로 추출 시도
  const a2uiRegex = /```a2ui\s*([\s\S]*?)```/;
  const match = content.match(a2uiRegex);

  if (!match) {
    return { text: content };
  }

  try {
    const a2ui = JSON.parse(match[1].trim()) as A2UIBlock;
    const text = content.replace(a2uiRegex, "").trim();
    return { text, a2ui };
  } catch {
    // JSON 파싱 실패 — 원본 텍스트 그대로 반환
    console.warn("A2UI 블록 파싱 실패:", match[1]);
    return { text: content };
  }
}

/**
 * LLM 응답에서 tool_calls 존재 여부를 판별한다.
 */
export function hasToolCalls(response: LLMResponse): boolean {
  return !!response.toolCalls && response.toolCalls.length > 0;
}
