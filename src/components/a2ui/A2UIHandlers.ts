import type { Orchestrator } from "../../core/orchestrator";
import { useCaseStore } from "../../core/util/caseStore"
import { mockCases } from "../../core/util/mockCases";
import type { QuestionResponse } from "./Scenario-1-Doc/QuestionForm";
import type { Hospital } from "./Scenario-3-Hosp/HospitalList";

interface AddressContactPayload {
    address: string;
    addressDetail: string;
    name: string;
    tel: string;
}

export function createA2UIHandler(orchestrator: Orchestrator) {

    // const HEALTHINFO_API_URL = import.meta.env.VITE_HEALTHINFO_API_URL ?? "";

    const handleShowDoctorConsentAgree = () => {
        orchestrator.handleUserMessage(
            "시나리오1 개인정보 유의사항 동의가 완료되었습니다. 다음 단계로 의사에게 보여줄 6자리 공유 코드 pincode A2UI를 출력하세요.",
            { hidden: true },
        );
    }

    const handleSendImageConsentAgree = () => {
        orchestrator.handleUserMessage(
            "시나리오5 제휴 병원 영상 전송 동의가 완료되었습니다. 영상 전송 완료 안내만 하세요.",
            { hidden: true },
        );
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
        
        orchestrator.handleUserMessage(
            `${selected.length}건의 영상이 선택되었습니다. 현재 시나리오의 다음 단계로 진행하세요.`,
            { hidden: true },
        );
    }

    const handleNotFoundImages = () => {
        orchestrator.handleUserMessage(
            "현재 영상 선택 목록에서 찾는 영상이 없습니다. 현재 시나리오 규칙에 맞는 다음 단계로 진행하세요.",
            { hidden: true },
        );
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

    const handleSubmitAddressContact = ({
        address,
        addressDetail,
        name,
        tel,
    }: AddressContactPayload) => {
        const hiddenInfo = [
            "입력된 등기우편 배송 정보",
            `주소: ${address}`,
            `상세주소: ${addressDetail}`,
            `수령인: ${name}`,
            `휴대전화 번호: ${tel}`,
        ].join("\n");

        orchestrator.addHiddenMessage(hiddenInfo);
        orchestrator.handleUserMessage("배송지와 연락처 입력을 완료했습니다.");
    };

    const handleChangeDeliveryInfo = () => {
        orchestrator.handleUserMessage("배송지 정보를 변경하겠습니다.");
    };

    const handleToggleMedicalConsent = (checked: boolean) => {
        if (checked) {
            orchestrator.addHiddenMessage("의료영상 발급 동의 항목을 확인했습니다.");
        }
    };

    const handleCdPayment = () => {
        orchestrator.handleUserMessage(
            "CD 발급 결제가 완료되었습니다. 현재 시나리오의 완료 안내만 하세요.",
            { hidden: true },
        );
    };

    const handleSelectHospital = (hospital: Hospital) => {
        orchestrator.addHiddenMessage(`선택된 병원: ${hospital.name} (${hospital.id})`);
        orchestrator.handleUserMessage(
            `${hospital.name}을 선택했습니다. 현재 시나리오의 다음 단계로 진행하세요.`,
            { hidden: true },
        );
    };

    const handlePurchaseImagingPayment = (payload: unknown) => {
        orchestrator.addHiddenMessage(`제휴 병원 영상 발급 결제 정보: ${JSON.stringify(payload)}`);
        orchestrator.handleUserMessage(
            "제휴 병원 영상 발급 결제가 완료되었습니다. 현재 시나리오의 다음 단계로 진행하세요.",
            { hidden: true },
        );
    };

    const handleDownloadImages = (imageIds: string[], /*fileType: "jpeg" | "dicom"*/) => {
        if (imageIds.length === 0) return;

        orchestrator.addHiddenMessage(`다운로드 선택 영상 목록: ${imageIds.join(", ")}`);
        orchestrator.handleUserMessage(
            `downloadImage 툴을 호출하세요.`,
            { hidden: true },
        );
    };

    return (action: string, payload: unknown) => {
        switch (action) {
      // scenario-1
      case "show-doctor-video-consent-form":
      case "agree-show-doctor-consent":
        handleShowDoctorConsentAgree();
        break;
      case "send-image-consent-form":
      case "agree-send-image-consent":
        handleSendImageConsentAgree();
        break;
      case "submit-questions": handleSubmitQuestions(payload as QuestionResponse); break;
      case "select-images": handleSelectImages(payload as string); break;
      case "submit-images": handleSubmitImages(); break;
      case "remove-image":
      case "deselect-image": handleDeselctImages(payload as string); break;
      case "not-found": handleNotFoundImages(); break;
      case "refresh-code": handleRefreshCode(); break;
      // scenario-2
      case "submit-address-contact":
        handleSubmitAddressContact(payload as AddressContactPayload);
        break;
      case "change-delivery-info":
        handleChangeDeliveryInfo();
        break;
      case "toggle-medical-consent":
        handleToggleMedicalConsent(payload as boolean);
        break;
      case "pay-cd-purchase":
        handleCdPayment();
        break;
      // scenario-3
      case "select-hospital":
        handleSelectHospital(payload as Hospital);
        break;
      case "pay-purchase-imaging":
        handlePurchaseImagingPayment(payload);
        break;
      // scenario-7
      case "download-images":
        handleDownloadImages(payload as string[]);
        break;
      default: break;
    }
    console.log("[App] A2UI action:", action, payload);
  };
}
