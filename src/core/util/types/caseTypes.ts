// 시리즈 내 이미지 ID
type ImageId = string;

// 시리즈
interface Series {
  seriesNumber: string | null;
  seriesInstanceUID: string;
  seriesDescription: string | null;
  images: ImageId[];
}

// 성별
type PatientSex = "M" | "F" | "O";

// 모달리티 (ModalityKey 재사용 가능)
type Modality =
  | "CT" | "MR" | "CR" | "DX" | "ECG" | "ES"
  | "MG" | "NM" | "PET" | "RF" | "US" | "XA"
  | "XC" | "PX" | "OCT" | "IVOCT" | "IVUS"
  | "OP" | "OT" | "NM" | "PT"
  | (string & {}); // 미지정 모달리티 허용 (string fallback)


// 케이스 (영상 검사 건)
export interface Case {
  caseId: string;
  patientId: string;
  birthDate: string;           // "YYYYMMDD" 형식
  patientName: string;         // "성^이름" 형식 (DICOM 컨벤션)
  patientSex: PatientSex;
  studyDate: string;           // "YYYYMMDD" 형식
  accessionNumber: string | null;
  studyInstanceUID: string;
  studyDescription: string; // 영상 이름
  modality: Modality;
  institutionName: string;
  imageHash: Record<string, unknown>;
  bodyPart: string[];
  series: Series[];
  createdAt: string | null;    // ISO 8601
  userId: string;
  requestedDate: string;       // ISO 8601
  acceptedDate: string;        // ISO 8601
  locked: boolean;
  contentIds: ImageId[];
}

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
