import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type {
  McpToolDefinition,
  McpCallToolRequest,
  McpCallToolResponse,
} from "../util/types/generalTypes";

// TODO: MCP 서버 주소를 환경변수 / 설정에서 로드
const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL;

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
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;

  constructor(baseUrl: string = MCP_SERVER_URL) {
    this.baseUrl = baseUrl;
  }

  /** 세션 아이디 : transport가 내부적으로 관리 */
    get sessionId(): string | null {
    return this.transport?.sessionId ?? null;
  }

  /**
   * MCP 서버와 초기화 핸드셰이크 수행
   *
   * initialize -> initialized handshake
   */
  async connect(): Promise<void> {
    if (this.client) return;
    console.log("[McpClient] connecting to", this.baseUrl);

    this.transport = new StreamableHTTPClientTransport(
      new URL(this.baseUrl),
    );
    this.client = new Client(
            {
        name: "hscan-healthhub-chatbot",
        version: "0.1.0",
      },
      {
        capabilities: {},
      }
    );

    await this.client.connect(this.transport);
    console.log("[McpClient] connected. sessionId =", this.sessionId);
  }

  /**
   * tools/list
   * MCP 서버에서 사용 가능한 tool 목록을 가져온다.
   */
  async listTools(): Promise<McpToolDefinition[]> {
    if (!this.client) await this.connect();

    const all: McpToolDefinition[] = [];
    let cursor: string | undefined; // cursor 페이지네이션 (sdk 프로토콜 준수)
    

    do {
      const result = await this.client!.listTools(
        cursor ? { cursor } : undefined
      );
      all.push(...(result.tools as McpToolDefinition[]));
      cursor = result.nextCursor;
    } while (cursor);

    console.log(`[McpClient] listed ${all.length} tools`);
    return all;
  }

  /**
   * tools/call
   * MCP 서버의 tool을 호출한다.
   *
   * 에러 - 프로토콜 에러(JSON-RPC error) : SDK가 throw함
   *     - 도구 실행 에러 (isError = true): 정상적으로 결과 반환됨, LLM 해석 필요
   */
  async callTool(request: McpCallToolRequest): Promise<McpCallToolResponse> {
    if (!this.client) await this.connect();

    console.log("[McpClient] calling tool:", request.toolName, request.arguments);

    const result = await this.client!.callTool({
      name: request.toolName,
      arguments: request.arguments ?? {},
    });

    return {
      content: result.structuredContent ?? result.content,
      isError: result.isError,
    };
  }

  /**
   * 세션 종료 - transport가 DELETE + Mcp-Session-Id 전송
   */
  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.close();
    } catch (e) {
      console.warn("[McpClient] disconnect error:", e);
    } finally {
      this.client = null;
      this.transport = null;
      console.log("[McpClient] disconnected");
    }
  }
}
