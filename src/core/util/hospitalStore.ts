import { create } from "zustand";

/**
 * 시나리오3·4·6에서 사용자가 선택한 제휴 병원 정보를 보관하는 스토어.
 *
 * 영상 발급 결제(POST /hospital/study/payment)는 "영상을 가져올 병원" 기준으로
 * 생성해야 한다. 시나리오6에서는 동시에 "영상을 보낼 병원"도 등장하므로 두 병원을
 * 단일 selected hospital로 보관하면 두 번째 선택이 첫 번째 선택을 덮어쓴다.
 */
export interface SelectedHospital {
  id: string;
  name: string;
}

export type HospitalPurpose = "issue-source" | "send-destination";

interface HospitalState {
  /** Backward-compatible alias for the source hospital. */
  hospital: SelectedHospital | null;
  issueSourceHospital: SelectedHospital | null;
  sendDestinationHospital: SelectedHospital | null;
  setHospital: (hospital: SelectedHospital | null) => void;
  setIssueSourceHospital: (hospital: SelectedHospital | null) => void;
  setSendDestinationHospital: (hospital: SelectedHospital | null) => void;
  clear: () => void;
}

export const useHospitalStore = create<HospitalState>((set) => ({
  hospital: null,
  issueSourceHospital: null,
  sendDestinationHospital: null,
  setHospital: (hospital) => set({ hospital, issueSourceHospital: hospital }),
  setIssueSourceHospital: (hospital) => set({ hospital, issueSourceHospital: hospital }),
  setSendDestinationHospital: (hospital) => set({ sendDestinationHospital: hospital }),
  clear: () =>
    set({
      hospital: null,
      issueSourceHospital: null,
      sendDestinationHospital: null,
    }),
}));
