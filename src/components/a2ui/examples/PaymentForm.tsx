import styles from "./A2UI.module.css";

interface PaymentFormProps {
  amount?: number;
  item?: string;
  onConfirm: (paymentData: unknown) => void;
  [key: string]: unknown;
}

/**
 * 결제 진행 A2UI 컴포넌트
 *
 * 영상 발급 비용 결제를 진행하는 UI.
 *
 * TODO: PG사 연동 (토스페이먼츠, 카카오페이 등)
 * TODO: 결제 수단 선택 (카드, 간편결제, 계좌이체)
 * TODO: 결제 금액 상세 내역 표시
 * TODO: 약관 동의 체크박스
 * TODO: 결제 진행 중 로딩 상태
 * TODO: 결제 성공/실패 결과 표시
 */
export default function PaymentForm({
  amount = 0,
  item = "",
  onConfirm,
}: PaymentFormProps) {
  const handlePayment = () => {
    // TODO: 실제 PG사 결제 모듈 호출
    onConfirm({ amount, item, method: "card" });
  };

  return (
    <div className={styles.payment}>
      <h4>결제 정보</h4>
      <div className={styles.paymentSummary}>
        <div className={styles.paymentRow}>
          <span>항목</span>
          <span>{item || "-"}</span>
        </div>
        <div className={`${styles.paymentRow} ${styles.total}`}>
          <span>결제 금액</span>
          <strong>{amount.toLocaleString()}원</strong>
        </div>
      </div>
      {/* TODO: 결제 수단 선택 UI */}
      <button className={styles.paymentButton} onClick={handlePayment}>
        결제하기
      </button>
    </div>
  );
}
