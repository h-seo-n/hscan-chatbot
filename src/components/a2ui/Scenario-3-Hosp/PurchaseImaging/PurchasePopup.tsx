import { useState } from "react";
import { createPortal } from "react-dom";
import { usePaymentPopupStore } from "./paymentPopupStore";
import { formatWon } from "./PurchaseTable";
import styles from "./PurchasePopup.module.css";

type PaymentStatus = "idle" | "processing" | "error";

/**
 * 제휴 병원 영상 발급용 더미 결제 모듈(팝업).
 *
 * `usePaymentPopupStore`를 구독해, 스토어가 열린 상태(`isOpen`)일 때만
 * dimmed 백드롭 위에 결제 다이얼로그를 띄운다. (앱 루트에 한 번만 마운트)
 *
 *   .----------------------------.
 *   |   xxxx 원 결제하기         |
 *   | [결제하기] [취소하기]       |
 *   '----------------------------'
 *
 * "결제하기"를 누르면 스토어에 전달된 `onConfirm`(결제 완료 API 호출 + LLM 알림)을
 * 실행하고, 성공하면 팝업을 닫는다. 실패하면 에러 상태로 전환해 재시도하게 한다.
 */
export default function PurchasePopup() {
  const isOpen = usePaymentPopupStore((s) => s.isOpen);
  const amount = usePaymentPopupStore((s) => s.amount);
  const onConfirm = usePaymentPopupStore((s) => s.onConfirm);
  const close = usePaymentPopupStore((s) => s.close);

  const [status, setStatus] = useState<PaymentStatus>("idle");

  if (!isOpen || typeof document === "undefined") return null;

  const isProcessing = status === "processing";

  const handleConfirm = async () => {
    if (!onConfirm || isProcessing) return;
    setStatus("processing");
    try {
      await onConfirm();
      setStatus("idle");
      close();
    } catch (e) {
      console.error("[PurchasePopup] 결제 실패", e);
      setStatus("error");
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    setStatus("idle");
    close();
  };

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="영상 발급 결제"
      >
        <p className={styles.amount}>
          <strong>{formatWon(amount)}</strong> 결제하기
        </p>

        {status === "error" && (
          <p className={styles.error}>
            결제에 실패했습니다. 다시 시도해 주세요.
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.payButton}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "결제 중…" : "결제하기"}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            취소하기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
