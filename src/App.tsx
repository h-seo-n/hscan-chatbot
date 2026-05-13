import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Orchestrator } from "./core/orchestrator";
import HomePage from "./components/Home/HomePage";
// import QuestionForm from "./components/a2ui/Scenario-1-Doc/QuestionForm";
// import ImageList from "./components/a2ui/Scenario-1-Doc/ImageList";
// import SelectedImages from "./components/a2ui/Scenario-1-Doc/SelectedImages";
// import ConsentForm from "./components/a2ui/Scenario-1-Doc/ConsentForm";
// import Pincode from "./components/a2ui/Scenario-1-Doc/Pincode";
// import AddressContactInfo from "./components/a2ui/Scenario-2-CD/AddressContactInfo";
// import DeliverInfoCard from "./components/a2ui/Scenario-2-CD/CDPurchaseCard/DeliverInfoCard";
import { createA2UIHandler } from "./components/a2ui/A2UIHandlers";
import { consoleLogger, sentryLogger } from "./core/util/logger";
import { useAuth } from "./core/util/auth/useAuth";

type InitStatus =
  | { kind: "idle" }
  | { kind: "connecting" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

/**
 * 앱 루트 컴포넌트
 *
 * TODO: API 키 입력 UI 또는 환경변수 연동 */
function App() {
  const orchestratorRef = useRef<Orchestrator | null>(null);
  const [initStatus, setInitStatus] = useState<InitStatus>({ kind: "idle" });
  const { isAuthenticated, user, fetchUser, accessToken } = useAuth();

  const logger = import.meta.env.DEV ? consoleLogger : sentryLogger;
  const appLogger = logger.child({ scope: "App" });
  const orchestratorLogger = logger.child({ scope: "Orchestrator" });

  const accessTokenRef = useRef(accessToken);
  useEffect(() => { // 항상 최신 토큰을 가리키는 ref
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // useEffect: authentication 변화 시 user 정보 GET
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser().catch((err) => {
        appLogger.error("userInfo 가져오기 실패", { error : err });
      });
    }
  }, [isAuthenticated, user])

  // useEffect : Orchestrator 생성 & 초기화
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";
    const baseUrl =
      import.meta.env.VITE_LLM_BASE_URL ??
      "https://api.openai.com/v1/chat/completions";
    const model = import.meta.env.VITE_LLM_MODEL ?? "gpt-5.4-mini";

    if (!apiKey) {
      setInitStatus({
        kind: "error",
        message: "API 키가 설정되지 않았습니다. VITE_OPENAI_API_KEY를 확인해주세요.",
      });
      return;
    }

    const orchestrator = new Orchestrator({
      apiKey,
      baseUrl,
      model,
      logger: orchestratorLogger,
      getAccessToken: () => accessTokenRef.current,
    });
    orchestratorRef.current = orchestrator;

    setInitStatus({ kind: "connecting" });

    let cancelled = false;
    orchestrator
      .init()
      .then(() => {
        if (!cancelled) setInitStatus({ kind: "ready" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        appLogger.error("Orchestrator 초기화 실패:", {error: err});
        setInitStatus({
          kind: "error",
          message:
            err instanceof Error ? err.message : "MCP 서버 연결에 실패했습니다.",
        });
      });

    return () => {
      cancelled = true;
      orchestrator.destroy();
      orchestratorRef.current = null;
    };
  }, []);

  /**  
   * orchestrator.ts의 handleUserMessage() wrapper 
   * useCallback으로 re-render 최소화   
  */
  const handleSendMessage = useCallback(async (text: string):Promise<void> => {
    const orchestrator = orchestratorRef.current;
    if (!orchestrator) {
      appLogger.warn("Orchestrator가 아직 준비되지 않았습니다");
      return;      
    }
    if (initStatus.kind !== "ready") {
      appLogger.warn("Orchestrator이 아직 초기화 중입니다");
      return;
    }
    await orchestrator.handleUserMessage(text);
  }, [initStatus.kind]);

  
  /**
   * 사용자가 출력 중단 시 handler
   */
  const handleAbort = useCallback(() => {
    orchestratorRef.current?.abort();
  }, []);

  /**
   * A2UIHandler: Orchestrator이 준비된 후에 createA2UIHandler 생성
   */
    const handleA2UIAction = useMemo(() => {
    if (initStatus.kind !== "ready" || !orchestratorRef.current) {
      return () => {
        appLogger.warn("Orchestrator 준비 전 A2UI 액션이 발생했습니다");
      };
    }
    return createA2UIHandler(orchestratorRef.current);
  }, [initStatus.kind]);

  // 렌더링
  if (initStatus.kind === "error") {
    return (
      <div style={{ padding: 24 }}>
        <h2>연결 오류</h2>
        <p>{initStatus.message}</p>
        <button onClick={() => window.location.reload()}>다시 시도</button>
      </div>
    );
  }

  if (initStatus.kind === "idle" || initStatus.kind === "connecting") {
    return (
      <div style={{ padding: 24 }}>
        <p>챗봇을 준비하는 중입니다…</p>
      </div>
    );
  }

  return (
    <div>
        <HomePage handleSendMessage={handleSendMessage} handleA2UIAction={handleA2UIAction} handleAbort={handleAbort}/>
	    {/* <QuestionForm questions={[]} />
      <ImageList 
        onSelect={(caseId) => handleA2UIAction("select-images", caseId)}
        onSubmit={() => handleA2UIAction("submit-images", null)}
        onNotFound={() => handleA2UIAction("not-found", null)}
        />
      <SelectedImages 
        onRemove={(caseId) => handleA2UIAction("deselect-image", caseId)}
        onNotFound={() => handleA2UIAction("not-found", null)}
      />
      <ConsentForm/>
      <Pincode code={"000000"} onRefreshCode={() => handleA2UIAction("refresh-code)", null)}/>
      <AddressContactInfo />
      <DeliverInfoCard/> */}
    </div>
  );}

export default App;
