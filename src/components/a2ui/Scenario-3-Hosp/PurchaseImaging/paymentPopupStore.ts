import { create } from "zustand";

/**
 * 제휴 병원 영상 발급 결제 팝업(PurchasePopup) 상태 스토어.
 *
 * A2UIHandlers의 `handlePurchaseImagingPayment`는 React 컴포넌트가 아닌
 * 일반 함수이므로 직접 팝업을 렌더링할 수 없다. 대신 이 스토어를 통해
 * 팝업을 열고(`open`), 결제 확정 콜백(`onConfirm`)을 전달한다.
 * 앱 루트에 마운트된 `PurchasePopup`이 이 스토어를 구독해 실제 UI를 렌더링한다.
 */
interface PaymentPopupState {
  isOpen: boolean;
  /** 결제 금액(원) */
  amount: number;
  /** 결제하기 클릭 시 실행할 콜백 — 결제 완료 API 호출 + LLM 알림. 실패 시 throw. */
  onConfirm: (() => Promise<void>) | null;

  open: (opts: { amount: number; onConfirm: () => Promise<void> }) => void;
  close: () => void;
}

export const usePaymentPopupStore = create<PaymentPopupState>((set) => ({
  isOpen: false,
  amount: 0,
  onConfirm: null,

  open: ({ amount, onConfirm }) => set({ isOpen: true, amount, onConfirm }),
  close: () => set({ isOpen: false, amount: 0, onConfirm: null }),
}));
