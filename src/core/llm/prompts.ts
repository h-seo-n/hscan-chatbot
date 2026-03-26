import type { McpToolDefinition } from "../util/types";

/**
 * 시스템 프롬프트를 생성한다.
 * MCP 서버에서 가져온 tool 목록을 주입하여
 * LLM이 어떤 tool을 호출할 수 있는지 인지하게 한다.
 */
export function buildSystemPrompt(tools: McpToolDefinition[]): string {
  const toolDescriptions = tools
    .map(
      (t) =>
        `- **${t.name}**: ${t.description}\n  Input: ${JSON.stringify(t.inputSchema)}`
    )
    .join("\n");

  // TODO: 프롬프트 세부 조정
  // TODO: A2UI 블록 생성 규칙을 프롬프트에 명시
  //       예) "병원을 선택해야 할 때는 { a2ui: { type: 'hospital-selector', ... } } 를 반환해라"
  return `당신은 건강검진 영상 조회·발급 서비스의 AI 어시스턴트입니다.

사용자의 요청을 이해하고, 필요한 경우 아래 도구(tool)를 호출하여 업무를 처리하세요.
텍스트 응답만으로 부족한 경우, 응답에 A2UI 블록을 포함하여 적절한 UI를 표시할 수 있습니다.

## 사용 가능한 도구
${toolDescriptions || "(아직 등록된 도구가 없습니다)"}

## A2UI 블록 규칙
- 병원 선택이 필요하면: \`{ "type": "hospital-selector", "props": { "hospitals": [...] } }\`
- 영상 목록 표시가 필요하면: \`{ "type": "video-selector", "props": { "videos": [...] } }\`
- 결제 진행이 필요하면: \`{ "type": "payment", "props": { "amount": ..., "item": ... } }\`
- 단순 정보 표시: \`{ "type": "info-card", "props": { "title": ..., "body": ... } }\`

항상 한국어로 친절하게 답변하세요.
`;
}
