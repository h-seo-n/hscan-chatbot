import { useEffect, useRef, useState } from "react";
import type { A2UIBlock } from "../../core/util/types/a2uiSchema";
import type { Case } from "../../core/util/types/caseTypes";
import { useCaseStore } from "../../core/util/caseStore";
import { useCdDeliveryPaymentStore } from "../../core/util/cdDeliveryPaymentStore";
import { useAuth } from "../../core/util/auth/useAuth";
import { createAuthenticatedFetch } from "../../core/util/auth/authFetch";

// Scenario #1
import ConsentForm from "./Scenario-1-Doc/ConsentForm";
import ImageList from "./Scenario-1-Doc/ImageList";
import SelectedImages from "./Scenario-1-Doc/SelectedImages";
import Pincode from "./Scenario-1-Doc/Pincode";
import QuestionForm from "./Scenario-1-Doc/QuestionForm";
import { SEND_IMAGE_CONSENT_ITEMS, SHOW_DOCTOR_CONSENT_ITEMS } from "../../core/util/constant";

// Scenario #2
import AddressContactInfo from "./Scenario-2-CD/AddressContactInfo";
import CDPurchaseCard from "./Scenario-2-CD/CDPurchaseCard";
import DeliverInfoCard from "./Scenario-2-CD/CDPurchaseCard/DeliverInfoCard";
import MedicalConsentForm from "./Scenario-2-CD/CDPurchaseCard/MedicalConsentForm";

// Scenario #3
import HospitalListComponent, { type Hospital } from "./Scenario-3-Hosp/HospitalList";
import HospitalImageList from "./Scenario-3-Hosp/HospitalImageList";
import PurchaseImaging from "./Scenario-3-Hosp/PurchaseImaging";
import PurchaseTable, { type PurchaseTableProps } from "./Scenario-3-Hosp/PurchaseImaging/PurchaseTable";

// Scenario #7
import DownloadImageList from "./Scenario-7-Down/DownloadImageList";
import DetailModalOverlay from "./Scenario-7-Down/DetailModal/DetailModalOverlay";

interface A2UIRendererProps {
  block: A2UIBlock;
  onAction: (action: string, payload: unknown) => void;
}

// LLM이 \`props.cases\`를 비우거나 빈 배열로 보낸 경우 store에 hydrate된 cases를 사용
function pickCases(
  fromProps: Case[] | undefined,
  fromStore: Case[] | undefined,
): Case[] | undefined {
  if (fromProps && fromProps.length > 0) return fromProps;
  if (fromStore && fromStore.length > 0) return fromStore;
  return undefined;
}

function MedicalConsentFormBlock({
  onAction,
}: {
  onAction: A2UIRendererProps["onAction"];
}) {
  const [checked, setChecked] = useState(false);

  return (
    <MedicalConsentForm
      checked={checked}
      onCheckedChange={(nextChecked) => {
        setChecked(nextChecked);
        onAction("toggle-medical-consent", nextChecked);
      }}
    />
  );
}

function ClosableDetailModal({
  series,
  onAction,
}: {
  series?: Case["series"];
  onAction: A2UIRendererProps["onAction"];
}) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <DetailModalOverlay
      series={series}
      onClose={() => {
        setOpen(false);
        onAction("close-detail-modal", null);
      }}
    />
  );
}

export default function A2UIRenderer({ block, onAction }: A2UIRendererProps) {
  // MCP tool 결과로 hydrate된 case 목록 - LLM이 props.cases를 비워두면 이걸 사용
  const hydratedCases = useCaseStore((s) => s.cases);
  const fetchCases = useCaseStore((s) => s.fetchCases);
  const cdDeliveryPayment = useCdDeliveryPaymentStore((s) => s.payment);
  const fallbackCases = hydratedCases.length > 0 ? hydratedCases : undefined;
  const { accessToken } = useAuth();
  const cdDeliveryInfo = cdDeliveryPayment
    ? {
        address: cdDeliveryPayment.mailingAddress.baseAddress,
        addressDetail: cdDeliveryPayment.mailingAddress.detailAddress,
        name: cdDeliveryPayment.mailingAddress.receiverName ?? undefined,
        tel: cdDeliveryPayment.mailingAddress.receiverPhone ?? undefined,
        registeredMailCost: cdDeliveryPayment.price.amount,
      }
    : null;

  // image-selector/download-selector는 내 계정 영상 목록(getImageList)을 필요로 한다.
  // LLM이 블록 출력 전에 영상 목록 tool을 호출하지 않으면 store가 비어 영상이 표시되지
  // 않으므로(첫 질문에서 "표시할 영상이 없습니다"가 뜨는 원인), 여기서 직접 /case를
  // 조회해 store를 hydrate한다. LLM의 tool 호출 누락과 무관하게 항상 채워지도록 한다.
  const isCaseSelector =
    block.type === "image-selector" || block.type === "download-selector";
  const propCases = isCaseSelector
    ? (block.props as { cases?: Case[] }).cases
    : undefined;
  const needsFetch =
    isCaseSelector &&
    (!propCases || propCases.length === 0) &&
    hydratedCases.length === 0;
  const fetchAttemptedRef = useRef(false);

  useEffect(() => {
    if (!needsFetch || !accessToken || fetchAttemptedRef.current) return;
    // 한 인스턴스당 한 번만 시도 (결과가 빈 목록이어도 재요청 루프에 빠지지 않게)
    fetchAttemptedRef.current = true;
    const authFetch = createAuthenticatedFetch(() => accessToken);
    void fetchCases(undefined, authFetch);
  }, [needsFetch, accessToken, fetchCases]);

  if (isCaseSelector) {
    console.log(`[A2UIRenderer] ${block.type}`, {
      propsCasesCount: propCases?.length ?? 0,
      storeCasesCount: hydratedCases.length,
      using:
        propCases && propCases.length > 0
          ? "props.cases"
          : hydratedCases.length > 0
            ? "store cases"
            : "component fallback (mock)",
    });
  }

  switch (block.type) {
    case "show-doctor-video-consent-form":
      return (
        <ConsentForm items={SHOW_DOCTOR_CONSENT_ITEMS} onConfirm={() => onAction("show-doctor-video-consent-form", null)}/>
      );

    case "send-image-consent-form":
      return (
        <ConsentForm items={SEND_IMAGE_CONSENT_ITEMS} onConfirm={() => onAction("agree-send-image-consent", null)}/>
      );

    case "image-selector":
      return (
        <ImageList
          cases={pickCases(block.props.cases as Case[] | undefined, fallbackCases)}
          onSelect={(caseId) => onAction("select-images", caseId)}
          onSubmit={() => onAction("submit-images", null)}
          onNotFound={() => onAction("not-found", null)}
        />

      );

    case "selected-images-list":
      return (
        <SelectedImages 
          onRemove={(caseId) => onAction("deselect-image", caseId)}
          onNotFound={() => onAction("not-found", null)}
        />
      );

    case "pincode":
      return (
        <Pincode
          code={block.props.code as string}
          onRefreshCode={() => onAction("refresh-code", null)}
        />
      );

    case "question-form":
      return (
        <QuestionForm
          questions={block.props.questions as Parameters<typeof QuestionForm>[0]["questions"]}
          onSubmit={(payload) => onAction("submit-questions", payload)}
        />
      );

    case "address-contact-input":
      return (
        <AddressContactInfo
          initialValues={block.props.initialValues}
          onSubmit={(address, addressDetail, name, tel) =>
            onAction("submit-address-contact", { address, addressDetail, name, tel })
          }
        />
      );

    case "medical-consent-form":
      return <MedicalConsentFormBlock onAction={onAction} />;

    case "delivery-info-card":
      return (
        <DeliverInfoCard
          address={block.props.address ?? cdDeliveryInfo?.address}
          addressDetail={block.props.addressDetail ?? cdDeliveryInfo?.addressDetail}
          name={block.props.name ?? cdDeliveryInfo?.name}
          tel={block.props.tel ?? cdDeliveryInfo?.tel}
          registeredMailCost={block.props.registeredMailCost ?? cdDeliveryInfo?.registeredMailCost}
          onChange={() => onAction("change-delivery-info", null)}
        />
      );

    case "cd-purchase-card":
      return (
        <CDPurchaseCard
          address={block.props.address ?? cdDeliveryInfo?.address}
          addressDetail={block.props.addressDetail ?? cdDeliveryInfo?.addressDetail}
          name={block.props.name ?? cdDeliveryInfo?.name}
          tel={block.props.tel ?? cdDeliveryInfo?.tel}
          registeredMailCost={block.props.registeredMailCost ?? cdDeliveryInfo?.registeredMailCost}
          onPayment={() => onAction("pay-cd-purchase", block.props)}
        />
      );

    case "hospital-selector":
      return (
        <HospitalListComponent
          HospitalList={block.props.hospitals as Hospital[] | undefined}
          onSubmit={(hospital) => onAction("select-hospital", hospital)}
        />
      );

    case "hospital-image-selector":
      return (
        <HospitalImageList
          cases={pickCases(block.props.cases as Case[] | undefined, fallbackCases)}
          submitLabel={block.props.submitLabel}
          onSelect={(caseId) => onAction("select-images", caseId)}
          onSubmit={() => onAction("submit-hospital-images", null)}
        />
      );

    case "purchase-imaging":
      return (
        <PurchaseImaging
          hospitalName={block.props.hospitalName}
          selectedVideoCount={block.props.selectedVideoCount}
          issueCost={block.props.issueCost}
          agencyFee={block.props.agencyFee}
          vat={block.props.vat}
          onPayment={() => onAction("pay-purchase-imaging", block.props)}
        />
      );

    case "purchase-table":
      return <PurchaseTable {...(block.props as PurchaseTableProps)} />;

    case "download-selector":
      return (
        <DownloadImageList
          cases={pickCases(block.props.cases as Case[] | undefined, fallbackCases)}
          submitLabel={block.props.submitLabel}
          onSelect={(imageIds, fileType) => onAction("download-images", { imageIds, fileType })}
          onNotFound={() => onAction("not-found", null)}
        />
      );

    case "detail-modal":
      return (
        <ClosableDetailModal
          series={block.props.series as Case["series"] | undefined}
          onAction={onAction}
        />
      );

    default:
      console.warn("[A2UIRenderer] 알 수 없는 A2UI 타입:", (block as { type: string }).type);
      return (
        <div className="a2ui-fallback">
          지원하지 않는 UI 형식입니다.
        </div>
      );
  }
}
