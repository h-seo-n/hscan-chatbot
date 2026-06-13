/**
 * 제휴 병원 영상 발급 결제 API.
 *
 * MCP의 `requestImage` 툴 경로가 동작하지 않아, 결제 "생성"(POST hospital/study/payment)을
 * 클라이언트에서 직접 호출한다(`requestImageIssuance`). 결제 "완료"(PUT)는 기존처럼
 * 더미 결제 모듈(PurchasePopup)에서 "결제하기"를 누른 시점에 `completeImagingPayment`로 처리한다.
 */

import { createAuthenticatedFetch } from "../../../../core/util/auth/authFetch";
import type { AccessTokenProvider } from "../../../../core/util/types/generalTypes";
import type { StudyPayment } from "../../../../core/util/paymentStore";

const BASE_URL = import.meta.env.VITE_HEALTHINFO_API_URL as string;

function apiUrl(endpoint: string): string {
  const base = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  return new URL(endpoint.replace(/^\/+/, ""), base).toString();
}

async function parseResponse<T>(res: Response, method: string, endpoint: string): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    const detail = text ? ` ${text}` : "";
    throw new Error(`API ${method} ${endpoint} 실패: ${res.status} ${res.statusText}${detail}`);
  }

  return (text ? JSON.parse(text) : null) as T;
}

async function apiGet<T>(
  endpoint: string,
  getAccessToken: AccessTokenProvider,
): Promise<T> {
  const authFetch = createAuthenticatedFetch(getAccessToken);
  const res = await authFetch(apiUrl(endpoint), { method: "GET" });
  return parseResponse<T>(res, "GET", endpoint);
}

async function apiPost<T>(
  endpoint: string,
  body: unknown,
  getAccessToken: AccessTokenProvider,
): Promise<T> {
  const authFetch = createAuthenticatedFetch(getAccessToken);
  const res = await authFetch(apiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res, "POST", endpoint);
}

/* ---- 병원/검사/가격 타입 (hscan-mcp-server types.ts에서 포팅) ------------------- */

export type ModalityKey =
  | "CT" | "MR" | "CR" | "DX" | "ECG" | "ES"
  | "MG" | "NM" | "PET" | "RF" | "US" | "XA"
  | "XC" | "PX" | "OCT" | "IVOCT" | "IVUS";

interface ModalityConfig {
  virtualSize: number;
}

interface VolumeUnit {
  name: string;
  virtualVolume: number;
  volume: number;
  price: number;
  taxFree: number;
  unit: string;
}

interface SimplePrice {
  type: "SIMPLE";
  amount: number;
  taxFree: number;
}

interface Volume2Price {
  type: "VOLUME2";
  units: VolumeUnit[];
  modalities: Partial<Record<ModalityKey, ModalityConfig>>;
  defaultOption: ModalityConfig;
  useExpectedPrice: boolean;
}

type HospitalPrice = SimplePrice | Volume2Price;

/** GET /hospital 응답 항목 (가격 정책 포함) */
export interface HospitalWithPrice {
  id: string;
  name: string;
  price: HospitalPrice;
}

/** GET /hospital/{id}/study 응답 항목 (아직 가져오지 않은 병원 검사) */
export interface HospitalStudy {
  studyInstanceUID: string;
  date: string;
  modalities: string[];
  studyDescription: string | null;
  status: string;
  numImages: number;
}

export function getHospitals(
  getAccessToken: AccessTokenProvider,
): Promise<HospitalWithPrice[]> {
  return apiGet<HospitalWithPrice[]>("hospital", getAccessToken);
}

export function getStudiesByHospital(
  hospitalId: string,
  getAccessToken: AccessTokenProvider,
): Promise<HospitalStudy[]> {
  return apiGet<HospitalStudy[]>(`hospital/${hospitalId}/study`, getAccessToken);
}

/** 병원 가격 정책 + 단일 검사 정보로 결제 금액을 계산한다. */
function calculateStudyPrice(hospital: HospitalWithPrice, study: HospitalStudy): number {
  const price = hospital.price;
  if (price.type === "SIMPLE") {
    return price.amount;
  }

  const sortedUnits = [...price.units].sort((a, b) => a.virtualVolume - b.virtualVolume);

  if (!price.useExpectedPrice) {
    const sortedByVolume = [...price.units].sort((a, b) => a.volume - b.volume);
    const totalVolume = Math.max(0, study.numImages ?? 0);
    const unit =
      sortedByVolume.find((u) => u.volume >= totalVolume) ??
      sortedByVolume[sortedByVolume.length - 1];

    return unit.price;
  }

  const totalVirtualSize = study.modalities.reduce((sum, modality) => {
    const config = price.modalities[modality as ModalityKey] ?? price.defaultOption;
    return sum + config.virtualSize;
  }, 0);

  const unit =
    sortedUnits.find((u) => u.virtualVolume >= totalVirtualSize) ??
    sortedUnits[sortedUnits.length - 1];

  return unit.price;
}

function calculateTotalPrice(hospital: HospitalWithPrice, studies: HospitalStudy[]): number {
  return studies.reduce(
    (total, study) => total + calculateStudyPrice(hospital, study),
    0,
  );
}

/**
 * 제휴 병원 영상 발급 결제 "생성".
 *
 * 선택한 병원의 검사 목록(GET /hospital/{id}/study)과 병원 가격 정책(GET /hospital)을
 * 조회해, 선택한 studyInstanceUID들에 해당하는 검사로 결제(POST /hospital/study/payment)를
 * 생성하고 결제 정보(결제 id + 확정 금액)를 반환한다. 실제 완료(PUT)는 별도다.
 */
export async function requestImageIssuance(args: {
  hospitalId?: string;
  hospitalName?: string;
  studyInstanceUIDs: string[];
  getAccessToken: AccessTokenProvider;
}): Promise<StudyPayment> {
  const hospitals = await getHospitals(args.getAccessToken);
  // 선택 시점 id가 백엔드 id와 다를 수 있어 name으로도 매칭한다.
  const hospital = hospitals.find(
    (h) =>
      (args.hospitalId ? h.id === args.hospitalId : false) ||
      (args.hospitalName ? h.name === args.hospitalName : false),
  );
  if (!hospital) {
    throw new Error(
      `병원을 찾을 수 없습니다 (id: ${args.hospitalId}, name: ${args.hospitalName ?? "-"})`,
    );
  }

  const studies = await getStudiesByHospital(hospital.id, args.getAccessToken);
  const uniqueStudyInstanceUIDs = [...new Set(args.studyInstanceUIDs)];
  const requestStudies = uniqueStudyInstanceUIDs
    .map((uid) => studies.find((s) => s.studyInstanceUID === uid))
    .filter((s): s is HospitalStudy => Boolean(s));
  if (requestStudies.length === 0) {
    throw new Error(
      `발급할 검사를 찾을 수 없습니다 (studyInstanceUID: ${args.studyInstanceUIDs.join(", ")})`,
    );
  }

  const price = calculateTotalPrice(hospital, requestStudies);
  const priceBreakdown = requestStudies.map((study) => ({
    studyInstanceUID: study.studyInstanceUID,
    modalities: study.modalities,
    numImages: study.numImages,
    price: calculateStudyPrice(hospital, study),
  }));
  const missingStudyInstanceUIDs = uniqueStudyInstanceUIDs.filter(
    (uid) => !requestStudies.some((study) => study.studyInstanceUID === uid),
  );

  console.log("[paymentApi] requestImageIssuance", {
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    requestedStudyCount: uniqueStudyInstanceUIDs.length,
    matchedStudyCount: requestStudies.length,
    missingStudyInstanceUIDs,
    useExpectedPrice: hospital.price.type === "VOLUME2" ? hospital.price.useExpectedPrice : null,
    priceBreakdown,
    mailingIncluded: false,
    price,
  });

  return apiPost<StudyPayment>(
    "hospital/study/payment",
    {
      mailingIncluded: false,
      price,
      requestStudies: { [hospital.id]: requestStudies },
    },
    args.getAccessToken,
  );
}

export interface CompleteImagingPaymentResult {
  ok: boolean;
  status: number;
}

export async function completeImagingPayment(
  payment: StudyPayment,
  getAccessToken: AccessTokenProvider,
): Promise<CompleteImagingPaymentResult> {
  console.log("[paymentApi] completeImagingPayment 호출", { paymentId: payment.id });

  const authFetch = createAuthenticatedFetch(getAccessToken);
  const res = await authFetch(apiUrl(`hospital/study/payment/${payment.id}`), { method: "PUT" });

  return { ok: res.ok, status: res.status };
}
