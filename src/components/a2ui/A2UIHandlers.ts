import type { Orchestrator } from "../../core/orchestrator";
import { useCaseStore } from "../../core/util/caseStore"
import { mockCases } from "../../core/util/mockCases";
import type { QuestionResponse } from "./Scenario-1-Doc/QuestionForm";

export function createA2UIHandler(orchestrator: Orchestrator) {

    // const HEALTHINFO_API_URL = import.meta.env.VITE_HEALTHINFO_API_URL ?? "";

    const handleShowDoctorConsentAgree = () => {
        orchestrator.handleUserMessage("개인정보 유의사항에 모두 동의");
    }

    const handleSubmitQuestions = (response: QuestionResponse) => {  
        const questionResponse = response.selectedQuestions
                                    .map(({ item, value }, i) =>
                                        `Q${i + 1}. ${item.question}\n답변: ${value || "(없음)"}`
                                    ).join("\n\n");
        orchestrator.handleUserMessage(questionResponse);
    }

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
        const selected = useCaseStore.getState().selectedCases;
        if (selected.length === 0) return;
        const names = selected.map((c) => c.caseId).join(", ");
        
        const hiddenInfo = `선택된 영상 목록 : ${names}`
        orchestrator.addHiddenMessage(hiddenInfo);
        
        const message = `${selected.length}건의 영상이 선택되었습니다`;
        orchestrator.handleUserMessage(message);
    }

    const handleNotFoundImages = () => {
        orchestrator.handleUserMessage("찾는 영상이 목록에 없습니다.");
    };

    const handleRefreshCode = async () => {
        /* 
         // 새로운 6자리 랜덤 코드 생성
        try {
            const url = new URL(`${HEALTHINFO_API_URL}/share-code`);
            const res = await fetch(url.toString(), {
                method: "POST",
                body: JSON.stringify({
                    caseId: caseIds,
                }),
            });
            if (!res.ok) {
                throw new Error(`GET /case failed: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            const code = data.code;
            return code;
        } catch (e) {
              console.error("Refresh code error:", e);
        }
        */
        orchestrator.handleUserMessage("코드 다시 생성"); 
    };

    return (action: string, payload: unknown) => {
        switch (action) {
      // scenario-1
      case "show-doctor-video-consent-form": handleShowDoctorConsentAgree(); break;
      case "submit-questions": handleSubmitQuestions(payload as QuestionResponse); break;
      case "select-images": handleSelectImages(payload as string); break;
      case "submit-images": handleSubmitImages(); break;
      case "deselect-image": handleDeselctImages(payload as string); break;
      case "not-found": handleNotFoundImages(); break;
      case "refresh-code": handleRefreshCode(); break;
      default: break;
    }
    console.log("[App] A2UI action:", action, payload);
  };
}


