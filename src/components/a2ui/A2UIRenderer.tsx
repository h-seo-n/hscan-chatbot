import type { A2UIBlock } from "../../core/util/types/generalTypes";

// Scenario #1
import ConsentForm from "./Scenario-1-Doc/ConsentForm";
import ImageList from "./Scenario-1-Doc/ImageList";
import SelectedImages from "./Scenario-1-Doc/SelectedImages";
import Pincode from "./Scenario-1-Doc/Pincode";
import QuestionForm from "./Scenario-1-Doc/QuestionForm";
import { SHOW_DOCTOR_CONSENT_ITEMS } from "../../core/util/constant";
import handleA2UIAction from "../A2UIHandlers";

interface A2UIRendererProps {
  block: A2UIBlock;
  onAction: (action: string, payload: unknown) => void;
}

export default function A2UIRenderer({ block, onAction }: A2UIRendererProps) {
  switch (block.type) {
    case "show-doctor-video-consent-form":
      return (
        <ConsentForm items={SHOW_DOCTOR_CONSENT_ITEMS} onConfirm={() => onAction?.("agree-show-doctor-consent", null)}/>
      );

    case "image-selector":
      return (
        <ImageList 
          onSelect={(caseId) => handleA2UIAction("select-images", caseId)}
          onSubmit={() => handleA2UIAction("submit-images", null)}
          onNotFound={() => handleA2UIAction("not-found", null)}
        />

      );

    case "selected-images-list":
      return (
        <SelectedImages 
          onRemove={(caseId) => handleA2UIAction("remove-image", caseId)}
          onNotFound={() => handleA2UIAction("not-found", null)}
        />
      );

    case "pincode":
      return (
        <Pincode
          code={block.props.code as string}
          onRefreshCode={() => onAction?.("refresh-code", null)}
        />
      );

    case "question-form":
      return (
        <QuestionForm
          questions={block.props.questions as Parameters<typeof QuestionForm>[0]["questions"]}
          onSubmit={(payload) => onAction?.("submit-questions", payload)}
        />
      );

    default:
      console.warn("[A2UIRenderer] 알 수 없는 A2UI 타입:", block.type);
      return (
        <div className="a2ui-fallback">
          지원하지 않는 UI 형식입니다.
        </div>
      );
  }
}
