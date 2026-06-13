import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Case } from "../../../../core/util/types/caseTypes";
import DetailModal from ".";
import styles from "./DetailModalOverlay.module.css";

interface DetailModalOverlayProps {
  series?: Case["series"];
  onClose: () => void;
}

/**
 * DetailModal을 dimmed 백드롭 위에 띄우는 오버레이 래퍼.
 * 백드롭 클릭 시 닫히며, document.body로 portal 렌더링한다.
 */
export default function DetailModalOverlay({
  series,
  onClose,
}: DetailModalOverlayProps) {
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialogWrap} onClick={(event) => event.stopPropagation()}>
        <DetailModal series={series} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
