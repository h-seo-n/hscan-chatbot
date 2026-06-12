import { useState } from "react";
import type { A2UIBlock } from "../../core/util/types/a2uiSchema";
import type { Case } from "../../core/util/types/caseTypes";
import { useCaseStore } from "../../core/util/caseStore";

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
  const fallbackCases = hydratedCases.length > 0 ? hydratedCases : undefined;

  if (block.type === "image-selector" || block.type === "download-selector") {
    const propCases = (block.props as { cases?: Case[] }).cases;
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
          address={block.props.address}
          addressDetail={block.props.addressDetail}
          name={block.props.name}
          tel={block.props.tel}
          registeredMailCost={block.props.registeredMailCost}
          onChange={() => onAction("change-delivery-info", null)}
        />
      );

    case "cd-purchase-card":
      return (
        <CDPurchaseCard
          address={block.props.address}
          addressDetail={block.props.addressDetail}
          name={block.props.name}
          tel={block.props.tel}
          registeredMailCost={block.props.registeredMailCost}
          onPayment={() => onAction("pay-cd-purchase", null)}
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
          onSubmit={() => onAction("submit-images", null)}
          onNotFound={() => onAction("not-found", null)}
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
