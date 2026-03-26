import type { LLMRequestMessage, LLMResponse, ToolCall } from "../util/types";

// TODO: 환경변수 또는 설정 파일에서 로드하도록 변경
const LLM_API_URL = "https://api.openai.com/v1/chat/completions";
const LLM_MODEL = "gpt-4o";

/**
 * OpenAI Chat Completions API를 호출한다.
 *
 * TODO: API 키를 안전하게 관리 (브라우저 직접 호출 시 프록시 서버를 거치도록)
 * TODO: 스트리밍(SSE) 응답 지원
 * TODO: tool_choice, function_call 파라미터 세팅
 * TODO: 에러 핸들링 & 재시도 로직
 */
export async function callLLM(
  messages: LLMRequestMessage[],
  apiKey: string,
  tools?: unknown[]
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: LLM_MODEL,
    messages,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    // TODO: tool_choice 전략 설정 ("auto" | "required" | specific tool)
  }

  const res = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // TODO: 상태 코드별 에러 처리 (429 rate-limit, 401 인증, etc.)
    throw new Error(`LLM API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];

  const toolCalls: ToolCall[] | undefined = choice?.message?.tool_calls?.map(
    (tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    })
  );

  return {
    content: choice?.message?.content ?? "",
    toolCalls: toolCalls?.length ? toolCalls : undefined,
    raw: data,
  };
}
