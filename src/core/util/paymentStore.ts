import { create } from "zustand";

/**
 * 제휴 병원 영상 발급 결제 정보 스토어.
 *
 * MCP의 `requestImage` 툴은 실제 결제를 진행하지 않고 결제 정보(결제 id + 금액)만
 * 반환한다. Orchestrator가 툴 결과에서 이 정보를 추출해 여기에 보관하고,
 * 이후 결제 팝업(PurchasePopup)에서 "결제하기"를 누를 때 `id`로 결제 완료 API를 호출한다.
 */
export interface StudyPayment {
  /** 결제 id (requestImage가 반환) */
  id: string;
  price: {
    totalFee: number;
  };
}

interface PaymentState {
  payment: StudyPayment | null;
  setPayment: (payment: StudyPayment | null) => void;
  clear: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  payment: null,
  setPayment: (payment) => set({ payment }),
  clear: () => set({ payment: null }),
}));

/**
 * MCP `requestImage` 툴 결과에서 결제 정보를 추출한다.
 *
 * 지원 shape:
 * - { id, price: { totalFee } }
 * - [{ type: "text", text: "<stringified JSON>" }]
 */
export function extractStudyPayment(content: unknown): StudyPayment | null {
  const fromObject = (obj: unknown): StudyPayment | null => {
    if (!obj || typeof obj !== "object") return null;
    const rec = obj as Record<string, unknown>;

    if (typeof rec.id !== "string" || rec.id.length === 0) return null;

    const price = rec.price as Record<string, unknown> | undefined;
    const totalFee =
      price && typeof price.totalFee === "number" ? price.totalFee : 0;

    return { id: rec.id, price: { totalFee } };
  };

  const direct = fromObject(content);
  if (direct) return direct;

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block && typeof block === "object" && "text" in block) {
        try {
          const parsed = fromObject(JSON.parse((block as { text: string }).text));
          if (parsed) return parsed;
        } catch {
          // not JSON — skip
        }
      }
    }
  }

  return null;
}
