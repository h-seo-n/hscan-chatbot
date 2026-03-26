/**
 * Tool: create_payment
 *
 * 영상 발급 비용 결제를 생성한다.
 *
 * TODO: PG사 API 연동 (토스페이먼츠 / 카카오페이 등)
 * TODO: 결제 금액 계산 로직 (발급 건수, 영상 종류별 단가 등)
 * TODO: 결제 상태 관리 (생성 → 승인 → 완료 / 취소)
 * TODO: 결제 이력 저장
 */

export interface CreatePaymentParams {
  issueId: string;
  amount: number;
  method?: string; // card, kakao, toss 등
}

export interface PaymentResult {
  paymentId: string;
  status: "created" | "approved" | "completed" | "failed";
  approvalUrl?: string; // 사용자가 결제를 승인할 URL
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<PaymentResult> {
  // TODO: PG사 결제 생성 API 호출
  console.log("[createPayment] params:", params);

  // placeholder
  return {
    paymentId: "pay-001",
    status: "created",
  };
}
