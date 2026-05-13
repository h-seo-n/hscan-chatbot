import type { A2UIBlock } from "../../core/util/types/a2uiSchema";

// Scenario #1
import ConsentForm from "./Scenario-1-Doc/ConsentForm";
import ImageList from "./Scenario-1-Doc/ImageList";
import SelectedImages from "./Scenario-1-Doc/SelectedImages";
import Pincode from "./Scenario-1-Doc/Pincode";
import QuestionForm from "./Scenario-1-Doc/QuestionForm";
import { SHOW_DOCTOR_CONSENT_ITEMS } from "../../core/util/constant";

interface A2UIRendererProps {
  block: A2UIBlock;
  onAction: (action: string, payload: unknown) => void;
}

export default function A2UIRenderer({ block, onAction }: A2UIRendererProps) {
  switch (block.type) {
    case "show-doctor-video-consent-form":
      return (
        <ConsentForm items={SHOW_DOCTOR_CONSENT_ITEMS} onConfirm={() => onAction("show-doctor-video-consent-form", null)}/>
      );

    case "image-selector":
      return (
        <ImageList 
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

    default:
      console.warn("[A2UIRenderer] 알 수 없는 A2UI 타입:", block.type);
      return (
        <div className="a2ui-fallback">
          지원하지 않는 UI 형식입니다.
        </div>
      );
  }
}
