import { create } from "zustand";
import type { CdDeliveryPaymentResponse } from "../../components/a2ui/Scenario-2-CD/CDPurchaseCard/cdDeliveryPaymentApi";

interface CdDeliveryPaymentState {
  payment: CdDeliveryPaymentResponse | null;
  setPayment: (payment: CdDeliveryPaymentResponse | null) => void;
  clear: () => void;
}

export const useCdDeliveryPaymentStore = create<CdDeliveryPaymentState>((set) => ({
  payment: null,
  setPayment: (payment) => set({ payment }),
  clear: () => set({ payment: null }),
}));
