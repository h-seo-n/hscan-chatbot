import type {
  McpToolDefinition,
  McpCallToolRequest,
  McpCallToolResponse,
} from "../util/types";

// TODO: MCP 서버 주소를 환경변수 / 설정에서 로드
const MCP_SERVER_URL = "http://localhost:3100";

/**
 * MCP 클라이언트 — 브라우저에서 MCP 서버와 Streamable HTTP로 통신한다.
 *
 * 구조도 상 Orchestrator 내부의 "MCP client" 역할:
 *   Browser(Orchestrator) ──Streamable HTTP──▶ MCP Server
 *
 * TODO: Streamable HTTP(SSE) 트랜스포트 구현
 * TODO: 세션 관리 (Mcp-Session-Id 헤더)
 * TODO: 초기화 핸드셰이크 (initialize → initialized)
 * TODO: 재연결 & 에러 복구 로직
 */
export class McpClient {
  private baseUrl: string;
  // TODO: 세션 관리 구현 시 활성화
  public sessionId: string | null = null;

  constructor(baseUrl: string = MCP_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * MCP 서버와 초기화 핸드셰이크를 수행한다.
   *
   * TODO: initialize 요청 전송 → 서버 capabilities 수신
   * TODO: initialized 알림 전송
   */
  async connect(): Promise<void> {
    // TODO: POST /mcp — initialize 요청
    // TODO: 응답에서 sessionId 추출 & 저장
    // TODO: initialized 알림 전송
    console.log("[McpClient] connecting to", this.baseUrl);
  }

  /**
   * MCP 서버에서 사용 가능한 tool 목록을 가져온다.
   *
   * TODO: tools/list 요청 구현
   */
  async listTools(): Promise<McpToolDefinition[]> {
    // TODO: POST /mcp — { method: "tools/list" }
    // TODO: 응답 파싱하여 McpToolDefinition[] 반환
    console.log("[McpClient] listing tools");
    return [];
  }

  /**
   * MCP 서버의 tool을 호출한다.
   *
   * TODO: tools/call 요청 구현
   * TODO: 에러 응답 처리 (isError 플래그)
   */
  async callTool(request: McpCallToolRequest): Promise<McpCallToolResponse> {
    // TODO: POST /mcp — { method: "tools/call", params: { name, arguments } }
    console.log("[McpClient] calling tool:", request.toolName, request.arguments);

    // placeholder
    return {
      content: { message: `[TODO] ${request.toolName} 실행 결과` },
      isError: false,
    };
  }

  /**
   * 세션을 종료한다.
   */
  async disconnect(): Promise<void> {
    // TODO: 세션 정리 (DELETE 또는 close 알림)
    this.sessionId = null;
    console.log("[McpClient] disconnected");
  }
}
