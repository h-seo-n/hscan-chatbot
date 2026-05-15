import z from "zod";

// 필터 타입
export type FilterType = 'eq' | 'equalsIgnoreCase' | 'contains' | 'containsIgnoreCase'

// 성별
const PATIENT_SEX = ["M", "F", "O"] as const;

// 모달리티 (ModalityKey 재사용 가능)
const MODALITIES = [
  "CT","MR","CR","DX","ECG","ES","MG","NM","PET","RF","US",
  "XA","XC","PX","OCT","IVOCT","IVUS","OP","OT","PT",
] as const;

export const SeriesSchema = z.object({
  seriesNumber: z.string().nullable().default(null),
  seriesInstanceUID: z.string().min(1),
  seriesDescription: z.string().nullable().default(null),
  images: z.array(z.string()).default([]),
}).strict();

export const CaseSchema = z.object({
  caseId: z.string().min(1),
  patientId: z.string().default(""),
  birthDate: z.string().default(""),
  patientName: z.string().default(""),
  patientSex: z.enum(PATIENT_SEX).default("O"),
  studyDate: z.string().default(""),
  accessionNumber: z.string().nullable().default(null),
  studyInstanceUID: z.string().default(""),
  studyDescription: z.string().default("영상 이름"),
  modality: z.enum(MODALITIES),
  institutionName: z.string().default(""),
  imageHash: z.record(z.string(), z.unknown()).default({}),
  bodyPart: z.array(z.string()).default([]),
  series: z.array(SeriesSchema).default([]),
  createdAt: z.string().nullable().default(null),
  userId: z.string().default(""),
  requestedDate: z.string().default(""),
  acceptedDate: z.string().default(""),
  locked: z.boolean().default(false),
  contentIds: z.array(z.string()).default([]),
}).strict();
  
// 케이스 (영상 검사 건)
export type Case = z.infer<typeof CaseSchema>

// 페이지네이션 정렬 정보
interface SortInfo {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

// 페이지네이션 메타
interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: SortInfo;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

// API 응답 (페이지네이션 포함)
export interface CasePageResponse {
  content: Case[];
  pageable: Pageable;
  sort: SortInfo;
  first: boolean;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
}
