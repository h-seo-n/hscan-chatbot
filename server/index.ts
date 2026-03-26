/**
 * MCP Server — 구조도의 "MCP server" 에 해당.
 *
 * 브라우저의 Orchestrator(MCP client)로부터 Streamable HTTP 요청을 받아
 * 비즈니스 로직(영상 조회, 발급, 결제 등)을 수행하고,
 * 필요 시 외부 API(HealthInfo API 등)와 통신한다.
 *
 * TODO: Express/Hono 등 HTTP 프레임워크 선택 & 설정
 * TODO: @modelcontextprotocol/sdk 를 사용하여 MCP 서버 구현
 * TODO: Streamable HTTP 트랜스포트 설정
 * TODO: CORS 설정 (브라우저에서 직접 호출하므로)
 * TODO: 인증/인가 미들웨어
 * TODO: 로깅 미들웨어
 */

// import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = process.env.PORT ?? 3100;

// ─── MCP Server 초기화 ──────────────────────────────────────

/**
 * TODO: MCP 서버 인스턴스 생성
 *
 * const server = new McpServer({
 *   name: "hscan-mcp-server",
 *   version: "0.1.0",
 * });
 */

// ─── Tool 등록 ──────────────────────────────────────────────

/**
 * TODO: 각 tool을 등록한다
 *
 * server.tool("search_hospitals", { ... schema }, async (params) => { ... });
 * server.tool("get_videos",      { ... schema }, async (params) => { ... });
 * server.tool("issue_video",     { ... schema }, async (params) => { ... });
 * server.tool("create_payment",  { ... schema }, async (params) => { ... });
 */

// ─── HTTP 서버 시작 ─────────────────────────────────────────

/**
 * TODO: Express 앱 생성 & Streamable HTTP 트랜스포트 연결
 *
 * const app = express();
 * app.use(cors());
 * app.post("/mcp", async (req, res) => {
 *   const transport = new StreamableHTTPServerTransport({ ... });
 *   await server.connect(transport);
 *   // handle request
 * });
 * app.listen(PORT);
 */

console.log(`[MCP Server] TODO: 서버를 포트 ${PORT}에서 시작`);
