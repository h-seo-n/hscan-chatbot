import type { A2UIBlock } from "../../core/util/types";
import HospitalSelector from "./examples/HospitalSelector";
import VideoSelector from "./examples/VideoSelector";
import PaymentForm from "./examples/PaymentForm";
import InfoCard from "./examples/InfoCard";

interface A2UIRendererProps {
  block: A2UIBlock;
  onAction?: (action: string, payload: unknown) => void;
}

/**
 * A2UI 블록 타입에 따라 적절한 UI 컴포넌트를 렌더링하는 디스패처.
 *
 * LLM 응답에서 파싱된 A2UIBlock을 받아 해당하는 컴포넌트를 동적으로 선택한다.
 *
 * TODO: 새로운 A2UI 타입 추가 시 여기에 매핑 추가
 * TODO: 알 수 없는 타입에 대한 fallback UI
 * TODO: A2UI 컴포넌트 lazy loading (code splitting)
 */
export default function A2UIRenderer({ block, onAction }: A2UIRendererProps) {
  switch (block.type) {
    case "hospital-selector":
      return (
        <HospitalSelector
          {...(block.props as Record<string, unknown>)}
          onSelect={(hospitalId: string) =>
            onAction?.("select-hospital", { hospitalId })
          }
        />
      );

    case "video-selector":
      return (
        <VideoSelector
          {...(block.props as Record<string, unknown>)}
          onSelect={(videoId: string) =>
            onAction?.("select-video", { videoId })
          }
        />
      );

    case "payment":
      return (
        <PaymentForm
          {...(block.props as Record<string, unknown>)}
          onConfirm={(paymentData: unknown) =>
            onAction?.("confirm-payment", paymentData)
          }
        />
      );

    case "info-card":
      return <InfoCard {...(block.props as Record<string, unknown>)} />;


    default:
      console.warn("[A2UIRenderer] 알 수 없는 A2UI 타입:", block.type);
      return (
        <div className="a2ui-fallback">
          지원하지 않는 UI 형식입니다.
        </div>
      );
  }
}
