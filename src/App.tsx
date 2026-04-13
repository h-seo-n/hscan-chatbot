import { useEffect, useRef, useState } from "react";
import { Orchestrator } from "./core/orchestrator";
import HomePage from "./components/Home/page";
import QuestionForm from "./components/a2ui/Scenario-1-Doc/QuestionForm";
import ImageList from "./components/a2ui/Scenario-1-Doc/ImageList";
import SelectedImages from "./components/a2ui/Scenario-1-Doc/SelectedImages";
import ConsentForm from "./components/a2ui/Scenario-1-Doc/ConsentForm";
import Pincode from "./components/a2ui/Scenario-1-Doc/Pincode";
import AddressContactInfo from "./components/a2ui/Scenario-2-CD/AddressContactInfo";
import CDPurchaseCard from "./components/a2ui/Scenario-2-CD/CDPurchaseCard";

/**
 * 앱 루트 컴포넌트
 *
 * TODO: API 키 입력 UI 또는 환경변수 연동
 * TODO: Orchestrator 초기화 상태 표시 (연결 중 / 연결됨 / 오류)
 */
function App() {
  const orchestratorRef = useRef<Orchestrator | null>(null);
//  const [pincode, setPincode] = useState("123456");

  useEffect(() => {
    // TODO: API 키를 안전하게 가져오기 (환경변수, 사용자 입력, 또는 백엔드 프록시)
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY ?? "";
    const orchestrator = new Orchestrator(apiKey);
    orchestratorRef.current = orchestrator;

    orchestrator.init().catch((err) => {
      console.error("Orchestrator 초기화 실패:", err);
    });

    return () => {
      orchestrator.destroy();
    };
  }, []);

  const handleSendMessage = (text: string) => {
    orchestratorRef.current?.handleUserMessage(text);
  };

  const handleA2UIAction = (action: string, payload: unknown) => {
    // TODO: A2UI 사용자 액션을 Orchestrator로 전달
    //   예) "select-hospital" → 선택한 병원 정보를 user 메시지로 추가 후 LLM 재호출
    //   예) "confirm-payment" → 결제 tool 호출
    console.log("[App] A2UI action:", action, payload);
  };

  /*const handleRefreshCode = () => {
    // 새로운 6자리 랜덤 코드 생성
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setPincode(newCode);
  };*/

  return (
    <div>
      {/*original*/}
      <HomePage handleSendMessage={handleSendMessage} handleA2UIAction={handleA2UIAction}/>
      
      {/*Scenario1
	    <QuestionForm questions={[]} />
      <ImageList/>
      <SelectedImages/>
      <ConsentForm/>
      <Pincode code={pincode} onRefreshCode={handleRefreshCode}/>
      <AddressContactInfo/>
      <CDPurchaseCard/>*/}
    </div>
  );}

export default App;
