import type { Orchestrator } from "../../core/orchestrator";
import { useCaseStore } from "../../core/util/caseStore"
import { mockCases } from "../../core/util/mockCases";

export function createA2UIHandler(orchestrator: Orchestrator) {
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

    return (action: string, payload: unknown) => {
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
      default: break;
    }
    console.log("[App] A2UI action:", action, payload);
  };
}


