# HScan Chatbot Frontend

HScan 의료영상 조회·발급 챗봇의 프런트엔드 애플리케이션입니다.  
React + TypeScript + Vite 기반이며, 인증은 Keycloak OIDC를 사용하고 LLM 호출은 `hscan-mcp-server`의 프록시를 통해 처리합니다.

## 실행 개요

프런트엔드는 OpenAI API를 직접 호출하지 않습니다.  
LLM 요청은 백엔드의 `/api/llm/chat/completions`로 보내고, 백엔드가 실제 OpenAI API를 호출합니다.

즉, 개발 시에는 보통 아래 두 프로세스를 함께 실행해야 합니다.

1. `hscan-mcp-server` 실행
2. `hscan-chatbot` 실행

## 환경 변수

### 프런트엔드

`hscan-chatbot/.env*`에는 OpenAI API 키를 넣지 않습니다.

```env
VITE_LLM_BASE_URL=http://127.0.0.1:3000/api/llm/chat/completions
VITE_LLM_MODEL=server-configured
```

프로젝트에 따라 아래와 같은 인증/백엔드 관련 변수도 함께 필요할 수 있습니다.

```env
VITE_MCP_SERVER_URL=http://127.0.0.1:3000/mcp
VITE_HEALTHINFO_API_URL=...
VITE_KEYCLOAK_AUTHORITY=...
VITE_KEYCLOAK_CLIENT_ID=...
VITE_KEYCLOAK_REDIRECT_URI=...
VITE_KEYCLOAK_POST_LOGOUT_URI=...
```

### 백엔드

OpenAI API 키는 백엔드 환경 변수에만 둡니다.

```env
OPENAI_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-5.4-mini
```

프런트엔드에 남아 있는 `VITE_OPENAI_API_KEY`가 있다면 제거해야 합니다.

## 설치 및 실행

### 프런트엔드

```bash
npm install
npm run dev
```

기본 개발 서버는 Vite를 사용합니다.

### 백엔드

`/Users/seoyeonheo/projects/HScan/hscan-mcp-server`에서 실행합니다.

```bash
npm install
npm run dev
```

## 주요 스크립트

### 프런트엔드

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

- `dev`: Vite 개발 서버 실행
- `build`: TypeScript 빌드 후 프로덕션 번들 생성
- `lint`: ESLint 검사
- `preview`: 빌드 결과 로컬 미리보기

## 개발 메모

- 인증 토큰은 `react-oidc-context`와 `oidc-client-ts`를 통해 관리합니다.
- MCP 호출에는 브라우저용 MCP SDK와 Streamable HTTP transport를 사용합니다.
- A2UI 블록은 LLM 응답에서 파싱되어 동적 컴포넌트로 렌더링됩니다.
- 다운로드 요청은 백엔드가 파일을 임시 보관한 뒤 `downloadUrl`을 내려주는 방식으로 처리됩니다.

## Vite / ESLint 참고

이 프로젝트는 Vite 기반 React 앱입니다.  
추가적인 React Compiler 설정이나 타입 인지형 ESLint 규칙이 필요하면 Vite/React/TypeScript 공식 문서를 기준으로 확장하면 됩니다.
