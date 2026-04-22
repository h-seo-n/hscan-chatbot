import { useCaseStore } from "../core/util/caseStore"
import { mockCases } from "../core/util/mockCases";

const handleSelectImages = (caseId: string) => {
    const store = useCaseStore.getState();
    const alreadySelected = store.selectedCases.some((c) => c.caseId === caseId);
    if (alreadySelected) {
        store.deselectCase(caseId);
    } else {
        const found = mockCases.find((c) => c.caseId === caseId);
        if (found) store.selectCase(found)
    }
}

const handleDeselctImages = (caseId: string) => {
    useCaseStore.getState().deselectCase(caseId);
}

const handleSubmitImages = () => {
{/* send additional prompt messages to llm*/}
}

const handleNotFoundImages = () => {
{/* send additional prompt messages to llm*/}
}


const handleA2UIAction = (action: string, payload: unknown) => {
    // TODO: A2UI 사용자 액션을 Orchestrator로 전달
    //   예) "select-hospital" → 선택한 병원 정보를 user 메시지로 추가 후 LLM 재호출
    //   예) "confirm-payment" → 결제 tool 호출
    switch (action) {
      // scenario-1
      case "show-doctor-video-consent-form": break;
      case "submit-questions": break;
      case "select-images": handleSelectImages(payload as string); break;
      case "submit-images": handleSubmitImages(); break;
      case "deselect-image": handleDeselctImages(payload as string); break;
      case "not-found": handleNotFoundImages(); break;
      case "refresh-code": break;
      case "submit-questions": break;
      
    
      default:
        break;
    }
    console.log("[App] A2UI action:", action, payload);
  };


export default handleA2UIAction;