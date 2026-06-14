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
  headers?: HeadersInit,
): Promise<T> {
  const authFetch = createAuthenticatedFetch(getAccessToken);
  const res = await authFetch(apiUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(res, "POST", endpoint);
}

/* ---- 병원/검사/가격 타입 ------------------------------------------------------- */

/** GET /hospital 응답 항목 */
export interface HospitalInfo {
  id: string;
  name: string;
  price?: unknown;
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

interface FeeInfo {
  amount: number;
  taxFree: number;
  refundableAmount: number;
  refundableTaxFree: number;
}

interface StudyPaymentPrice {
  perHospitalPrice: Record<string, { onlinePrice: object }>;
  perHospitalFee: Record<string, FeeInfo>;
  deliveryFee: FeeInfo;
  totalFee: number;
  refundableFee: number;
  taxFree: number;
  refundableTaxFree: number;
}

interface StudyPaymentRequestBody {
  requestStudies: Record<string, HospitalStudy[]>;
  mailingIncluded: boolean;
}

export function getHospitals(
  getAccessToken: AccessTokenProvider,
): Promise<HospitalInfo[]> {
  return apiGet<HospitalInfo[]>("hospital", getAccessToken);
}

export function getStudiesByHospital(
  hospitalId: string,
  getAccessToken: AccessTokenProvider,
): Promise<HospitalStudy[]> {
  return apiGet<HospitalStudy[]>(`hospital/${hospitalId}/study`, getAccessToken);
}

async function getStudyPaymentPrice(
  body: StudyPaymentRequestBody,
  getAccessToken: AccessTokenProvider,
  registration?: string,
): Promise<StudyPaymentPrice> {
  const headers = registration ? { Registration: registration } : undefined;
  return apiPost<StudyPaymentPrice>(
    "hospital/study/payment/price",
    body,
    getAccessToken,
    headers,
  );
}

/**
 * 제휴 병원 영상 발급 결제 "생성".
 *
 * 선택한 병원의 검사 목록(GET /hospital/{id}/study)을 조회하고 가격 확인
 * (POST /hospital/study/payment/price)에서 받은 totalFee로 결제 준비
 * (POST /hospital/study/payment)를 생성한다. 실제 완료(PUT)는 별도다.
 */
export async function requestImageIssuance(args: {
  hospitalId?: string;
  hospitalName?: string;
  studyInstanceUIDs: string[];
  registration?: string;
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

  const paymentRequestBody = {
    mailingIncluded: false,
    requestStudies: { [hospital.id]: requestStudies },
  } satisfies StudyPaymentRequestBody;
  const priceInfo = await getStudyPaymentPrice(
    paymentRequestBody,
    args.getAccessToken,
    args.registration,
  );
  const price = priceInfo.totalFee;
  if (!Number.isFinite(price)) {
    throw new Error(`가격 확인 API 응답 totalFee가 올바르지 않습니다: ${String(price)}`);
  }

  const missingStudyInstanceUIDs = uniqueStudyInstanceUIDs.filter(
    (uid) => !requestStudies.some((study) => study.studyInstanceUID === uid),
  );

  console.log("[paymentApi] requestImageIssuance", {
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    requestedStudyCount: uniqueStudyInstanceUIDs.length,
    matchedStudyCount: requestStudies.length,
    missingStudyInstanceUIDs,
    perHospitalFee: priceInfo.perHospitalFee,
    deliveryFee: priceInfo.deliveryFee,
    mailingIncluded: false,
    price,
  });

  return apiPost<StudyPayment>(
    "hospital/study/payment",
    {
      ...paymentRequestBody,
      price,
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
