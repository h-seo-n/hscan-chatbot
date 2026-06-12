import type { Orchestrator } from "../../core/orchestrator";
import { useCaseStore } from "../../core/util/caseStore"
import { useCdDeliveryPaymentStore } from "../../core/util/cdDeliveryPaymentStore";
import { usePaymentStore } from "../../core/util/paymentStore";
import { useHospitalStore } from "../../core/util/hospitalStore";
import type { AccessTokenProvider } from "../../core/util/types/generalTypes";
import type { QuestionResponse } from "./Scenario-1-Doc/QuestionForm";
import type { Hospital } from "./Scenario-3-Hosp/HospitalList";
import type { DownloadFileType } from "./Scenario-7-Down/DownloadImageList";
import { usePaymentPopupStore } from "./Scenario-3-Hosp/PurchaseImaging/paymentPopupStore";
import {
    completeImagingPayment,
    requestImageIssuance,
} from "./Scenario-3-Hosp/PurchaseImaging/paymentApi";
import { calculatePurchaseTotal, parsePrice, type PurchaseTableProps } from "./Scenario-3-Hosp/PurchaseImaging/PurchaseTable";
import {
    completeCdDeliveryPayment,
    DEFAULT_CD_DELIVERY_FEE,
    requestCdDeliveryPayment,
    type CdDeliveryMailingAddress,
    type CdDeliveryPaymentResponse,
} from "./Scenario-2-CD/CDPurchaseCard/cdDeliveryPaymentApi";

interface AddressContactPayload {
    address: string;
    addressDetail: string;
    name: string;
    tel: string;
    registeredMailCost?: number | string;
}

export function createA2UIHandler(
    orchestrator: Orchestrator,
    getAccessToken: AccessTokenProvider,
) {

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
            const found = store.cases.find((c) => c.caseId === caseId);
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

    // 선택한 병원/검사로 영상 발급 결제를 생성(POST /hospital/study/payment)하고
    // 결제 정보(결제 id + 확정 금액)를 paymentStore에 보관한 뒤 반환한다.
    // 영상 선택 완료(submit-hospital-images)와 결제하기(pay-purchase-imaging) 양쪽에서
    // 사용한다. 선택 병원이나 검사가 없으면 명확한 에러를 던진다.
    const createImageIssuancePayment = async () => {
        const selected = useCaseStore.getState().selectedCases;
        const hospital = useHospitalStore.getState().hospital;
        const studyInstanceUIDs = selected
            .map((c) => c.studyInstanceUID || c.caseId)
            .filter((uid): uid is string => Boolean(uid));

        if (!hospital) {
            throw new Error("선택된 병원 정보가 없습니다. 병원 선택 단계부터 다시 진행해 주세요.");
        }
        if (studyInstanceUIDs.length === 0) {
            throw new Error("선택된 영상 정보가 없습니다. 영상 선택 단계부터 다시 진행해 주세요.");
        }

        const payment = await requestImageIssuance({
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            studyInstanceUIDs,
            getAccessToken,
        });
        usePaymentStore.getState().setPayment(payment);
        return payment;
    };

    // 제휴 병원 영상(hospital-image-selector)의 '가져오기' 클릭 시점.
    // 선택한 병원/검사로 영상 발급 결제를 미리 생성해 두고, LLM이 결제 화면
    // (purchase-imaging / index.tsx)을 렌더링하도록 안내한다.
    // 실제 결제 완료(PUT)는 이후 결제 단계(PurchasePopup "결제하기")에서 진행한다.
    const handleSubmitHospitalImages = async () => {
        const selected = useCaseStore.getState().selectedCases;
        if (selected.length === 0) return;

        let payment = null;
        try {
            payment = await createImageIssuancePayment();
        } catch (error) {
            // 여기서 실패해도 결제 단계(onConfirm)에서 한 번 더 시도하므로 로그만 남긴다.
            console.error("[A2UIHandlers] 영상 발급 결제 생성 실패", error);
        }

        const names = selected.map((c) => c.caseId).join(", ");
        orchestrator.addHiddenMessage(`선택된 병원 영상 목록 : ${names}`);

        const feeInfo = payment
            ? ` 확정 결제 금액은 ${payment.price.totalFee}원입니다.`
            : "";
        orchestrator.handleUserMessage(
            `제휴 병원에서 ${selected.length}건의 영상을 가져오기로 선택했습니다.${feeInfo} ` +
                `다음 단계로 결제 금액과 의료영상 발급 동의, 결제 버튼이 포함된 purchase-imaging A2UI를 출력하세요.`,
            { hidden: true },
        );
    };

    const handleNotFoundImages = () => {
        orchestrator.handleUserMessage(
            "현재 영상 선택 목록에서 찾는 영상이 없습니다. 바로 다음 단계로 넘어가지 말고, 현재 시나리오의 '찾는 영상이 없을 때' 규칙에 따라 응답하세요.",
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

    const getSelectedCaseIds = () => {
        const caseIds = useCaseStore.getState().selectedCases
            .map((c) => c.caseId)
            .filter((caseId): caseId is string => Boolean(caseId));

        return [...new Set(caseIds)];
    };

    const createCdDeliveryPayment = async ({
        address,
        addressDetail,
        name,
        tel,
        registeredMailCost,
    }: AddressContactPayload) => {
        const caseIds = getSelectedCaseIds();
        if (caseIds.length === 0) {
            throw new Error("CD로 발급할 영상이 선택되지 않았습니다.");
        }

        const deliveryFee = parsePrice(registeredMailCost ?? DEFAULT_CD_DELIVERY_FEE);
        const mailingAddress: Partial<CdDeliveryMailingAddress> = {
            baseAddress: address,
            detailAddress: addressDetail,
            receiverName: name,
            receiverPhone: tel,
        };

        const payment = await requestCdDeliveryPayment({
            caseIds,
            mailingAddress,
            deliveryFee,
            getAccessToken,
        });

        useCdDeliveryPaymentStore.getState().setPayment(payment);
        return payment;
    };

    const handleSubmitAddressContact = async (payload: AddressContactPayload) => {
        const {
            address,
            addressDetail,
            name,
            tel,
        } = payload;

        let payment: CdDeliveryPaymentResponse;
        try {
            payment = await createCdDeliveryPayment(payload);
        } catch (error) {
            console.error("[A2UIHandlers] CD 배송 결제 생성 실패", error);
            orchestrator.addHiddenMessage(
                `CD 배송 결제 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
            );
            orchestrator.handleUserMessage(
                "CD 배송 결제 생성에 실패했습니다. 결제 단계로 넘어가지 말고 사용자에게 영상 선택과 배송지 입력을 다시 확인하도록 안내하세요.",
                { hidden: true },
            );
            return;
        }

        const hiddenInfo = [
            "입력된 등기우편 배송 정보",
            `주소: ${address}`,
            `상세주소: ${addressDetail}`,
            `수령인: ${name}`,
            `휴대전화 번호: ${tel}`,
            `CD 배송 결제 id: ${payment.id}`,
            `CD 배송 결제 금액: ${payment.price.amount}원`,
            `CD 배송 결제 caseIds: ${payment.caseIds.join(", ")}`,
        ].join("\n");

        orchestrator.addHiddenMessage(hiddenInfo);
        orchestrator.handleUserMessage(
            "배송지와 연락처 입력 및 CD 배송 결제 생성이 완료되었습니다. 다음 응답에는 입력된 배송 정보, 의료영상 발급 동의, 결제 버튼이 포함된 cd-purchase-card A2UI를 출력하세요. registeredMailCost에는 CD 배송 결제 금액을 넣으세요.",
            { hidden: true },
        );
    };

    const handleChangeDeliveryInfo = () => {
        useCdDeliveryPaymentStore.getState().clear();
        orchestrator.handleUserMessage("배송지 정보를 변경하겠습니다.");
    };

    const handleToggleMedicalConsent = (checked: boolean) => {
        if (checked) {
            orchestrator.addHiddenMessage("의료영상 발급 동의 항목을 확인했습니다.");
        }
    };

    const handleCdPayment = (payload: unknown) => {
        const props = (payload ?? {}) as Partial<AddressContactPayload>;
        const payment = useCdDeliveryPaymentStore.getState().payment;
        const amount =
            payment?.price.amount ?? parsePrice(props.registeredMailCost ?? DEFAULT_CD_DELIVERY_FEE);

        usePaymentPopupStore.getState().open({
            amount,
            onConfirm: async () => {
                const current = useCdDeliveryPaymentStore.getState().payment;
                if (!current) {
                    throw new Error("CD 배송 결제 정보가 없습니다. 배송지 입력 단계부터 다시 진행해 주세요.");
                }

                const { ok, status } = await completeCdDeliveryPayment(current.id, getAccessToken);
                if (!ok) {
                    throw new Error(`결제 완료 실패 (status: ${status})`);
                }

                orchestrator.addHiddenMessage(
                    `CD 배송 결제 완료: 결제 id ${current.id}, 결제 금액 ${current.price.amount}원`,
                );
                orchestrator.handleUserMessage(
                    "CD 발급 결제가 완료되었습니다. 현재 시나리오의 완료 안내만 하세요.",
                    { hidden: true },
                );
                useCdDeliveryPaymentStore.getState().clear();
            },
        });
    };

    const handleSelectHospital = (hospital: Hospital) => {
        // 영상 발급 결제 시점에 hospitalId가 필요하므로 선택한 병원을 보관한다.
        useHospitalStore.getState().setHospital({ id: hospital.id, name: hospital.name });
        orchestrator.addHiddenMessage(`선택된 병원: ${hospital.name} (${hospital.id})`);
        orchestrator.handleUserMessage(
            `${hospital.name}을 선택했습니다. 현재 시나리오의 다음 단계로 진행하세요.`,
            { hidden: true },
        );
    };

    const handlePurchaseImagingPayment = (payload: unknown) => {
        // 영상 발급 결제는 영상 선택 완료(submit-hospital-images) 시점에 이미 생성되어 paymentStore에 있다.
        // 여기서는 더미 결제 팝업(PurchasePopup)을 열고, "결제하기"를 누르면 결제 완료(PUT)를 진행한다.
        const props = (payload ?? {}) as Partial<PurchaseTableProps>;
        const payment = usePaymentStore.getState().payment;

        // 결제 금액은 발급 결제가 알려준 확정 금액을 우선 사용하고, 없으면 props로 계산
        const amount = payment?.price.totalFee ?? calculatePurchaseTotal(props);

        usePaymentPopupStore.getState().open({
            amount,
            onConfirm: async () => {
                // 영상 선택 단계에서 결제 생성이 실패했을 수 있으므로, 없으면 여기서 한 번 더 생성한다.
                const current =
                    usePaymentStore.getState().payment ??
                    (await createImageIssuancePayment());

                // 실제 결제 진행 -> 결제 완료 API 호출
                const { ok, status } = await completeImagingPayment(current, getAccessToken);
                if (!ok) {
                    throw new Error(`결제 완료 실패 (status: ${status})`);
                }

                // 결제 성공(2xx) -> LLM에게 결제 완료 히든 메시지 전달
                orchestrator.addHiddenMessage(
                    `제휴 병원 영상 발급 결제 완료: 결제 id ${current.id}, 결제 금액 ${current.price.totalFee}원`,
                );
                orchestrator.handleUserMessage(
                    "제휴 병원 영상 발급 결제가 완료되었습니다. 현재 시나리오의 다음 단계로 진행하세요.",
                    { hidden: true },
                );
                usePaymentStore.getState().clear();
            },
        });
    };

    const handleDownloadImages = (imageIds: string[], fileType: DownloadFileType) => {
        if (imageIds.length === 0) return;

        orchestrator.addHiddenMessage(
            `다운로드 선택 영상 목록: ${imageIds.join(", ")} / 파일 형식: ${fileType}`,
        );
        orchestrator.handleUserMessage(
            `downloadImage 툴을 "${fileType}" 형식으로 호출하세요.`,
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
      case "submit-hospital-images": handleSubmitHospitalImages(); break;
      case "remove-image":
      case "deselect-image": handleDeselctImages(payload as string); break;
      case "not-found": handleNotFoundImages(); break;
      case "refresh-code": handleRefreshCode(); break;
      // scenario-2
      case "submit-address-contact":
        void handleSubmitAddressContact(payload as AddressContactPayload);
        break;
      case "change-delivery-info":
        handleChangeDeliveryInfo();
        break;
      case "toggle-medical-consent":
        handleToggleMedicalConsent(payload as boolean);
        break;
      case "pay-cd-purchase":
        handleCdPayment(payload);
        break;
      // scenario-3
      case "select-hospital":
        handleSelectHospital(payload as Hospital);
        break;
      case "pay-purchase-imaging":
        handlePurchaseImagingPayment(payload);
        break;
      // scenario-7
      case "download-images": {
        const { imageIds, fileType } = payload as {
          imageIds: string[];
          fileType: DownloadFileType;
        };
        handleDownloadImages(imageIds, fileType);
        break;
      }
      default: break;
    }
    console.log("[App] A2UI action:", action, payload);
  };
}
