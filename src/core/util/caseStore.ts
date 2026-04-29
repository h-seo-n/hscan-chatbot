import { create } from "zustand";
import type { Case, CasePageResponse, FilterType } from "./types/caseTypes";

const HEALTHINFO_API_URL = import.meta.env.VITE_HEALTHINFO_API_URL ?? "";

/** ------ Query params for GET /case ------ */
export interface CaseQueryParams {
  /** Filters by query */
  generalFilter?: string; // general.filter : 일반 검색어, 병원 이름 또는 환자 이름에 적용됨
  generalType?: FilterType; // general.type : 없으면 containsIgnoreCase 취급
  
  studyDateType?: 'eq' | 'before' | 'after' | 'between' // studyDate.type
  studyDateFrom?: string; // studyDate.date: "YYYYMMDD"
  studyDateTo?: string;   // studyDate.date2: "YYYYMMDD"

  bodypartFilter?: string; // bodypart.filter
  bodypartType?: FilterType; // bodypart.type
  modalitiesValues?: string; // modalities.values: https://www.dicomlibrary.com/dicom/modality/ 여기 적힌 CT, MR 등 을 , 로 이은 것
  
  /** Pagination */
  page?: number;
  size?: number;
}
/** ------ Case store state ------ */
interface CaseState {
  cases: Case[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;

  selectedCases: Case[];
  selectCase: (c: Case) => void;
  deselectCase: (caseId: string) => void;
  clearSelectedCases: () => void;

  /** Fetch cases: id 넣을 시 특정 Case만 반환; omit for filtered+paginated list. */
  fetchCases: (params?: CaseQueryParams) => Promise<void>;
  /** Replace the full list (e.g. after an external mutation) */
  setCases: (cases: Case[]) => void;
  clearCases: () => void;
}

export const useCaseStore = create<CaseState>((set) => ({
  case: null,
  cases: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  isLoading: false,
  error: null,

  selectedCases: [],
  selectCase: (c) =>
    set((s) =>
      s.selectedCases.some((sc) => sc.caseId === c.caseId)
        ? s
        : { selectedCases: [...s.selectedCases, c] }
    ),
  deselectCase: (caseId) =>
    set((s) => ({ selectedCases: s.selectedCases.filter((sc) => sc.caseId !== caseId) })),
  clearSelectedCases: () => set({ selectedCases: [] }),

  fetchCase: async (caseId: string) => {
    try {
      const res = await fetch(`${HEALTHINFO_API_URL}/case/${caseId}`);
      
      if (!res.ok) {
        throw new Error(`GET /case failed: ${res.status} ${res.statusText}`);
      }

      const data: Case = await res.json();
      return data;
    } catch(err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[caseStore] fetchCase error:", message);
    }
  },
  
  fetchCases: async (params = {}) => {
    set({ isLoading: true, error: null });

    try {
      const url = new URL(`${HEALTHINFO_API_URL}/case`);
      // if id exists : bypass all, just query for the specific id
      // Filtered + paginated listing, sorted by most recent
      if (params.page !== undefined) url.searchParams.set("page", String(params.page));
      if (params.size !== undefined) url.searchParams.set("size", String(params.size));

      if (params.generalFilter) url.searchParams.set("general.filter", params.generalFilter);
      if (params.generalType) url.searchParams.set("general.type", params.generalType);

      if (params.studyDateType) url.searchParams.set("studyDate.type", params.studyDateType);
      if (params.studyDateFrom) url.searchParams.set("studyDate.date", params.studyDateFrom);
      if (params.studyDateTo) url.searchParams.set("studyDate.date2", params.studyDateTo);

      if (params.modalitiesValues) url.searchParams.set("modality", params.modalitiesValues);
      if (params.bodypartFilter) url.searchParams.set("bodypart.filter", params.bodypartFilter);
      if (params.bodypartType) url.searchParams.set("studyDateFrom", params.bodypartType);      
      
      // 요청 결과
      const res = await fetch(url.toString());

      if (!res.ok) {
        throw new Error(`GET /case failed: ${res.status} ${res.statusText}`);
      }

      // 페이지네이션 응답
      const data: CasePageResponse = await res.json();
      set({
        cases: data.content,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.number,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[caseStore] fetchCases error:", message);
      set({ error: message, isLoading: false });
    }
  },

  setCases: (cases) => set({ cases }),

  clearCases: () =>
    set({ cases: [], totalElements: 0, totalPages: 0, currentPage: 0, error: null }),
}));
