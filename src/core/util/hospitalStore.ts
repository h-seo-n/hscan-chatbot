import { create } from "zustand";

/**
 * 시나리오3·4·6에서 사용자가 선택한 제휴 병원 정보를 보관하는 스토어.
 *
 * 영상 발급 결제(POST /hospital/study/payment)는 선택한 병원의 id가 필요하지만,
 * 결제 핸들러(`handlePurchaseImagingPayment`)가 받는 A2UI 블록 props에는 병원 id가 없다.
 * 병원 선택 단계(`handleSelectHospital`)에서 이 스토어에 보관해 결제 시점에 사용한다.
 */
export interface SelectedHospital {
  id: string;
  name: string;
}

interface HospitalState {
  hospital: SelectedHospital | null;
  setHospital: (hospital: SelectedHospital | null) => void;
  clear: () => void;
}

export const useHospitalStore = create<HospitalState>((set) => ({
  hospital: null,
  setHospital: (hospital) => set({ hospital }),
  clear: () => set({ hospital: null }),
}));
