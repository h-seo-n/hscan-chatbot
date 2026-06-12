import { createAuthenticatedFetch } from "../../../../core/util/auth/authFetch";
import type { AccessTokenProvider } from "../../../../core/util/types/generalTypes";

const BASE_URL = import.meta.env.VITE_HEALTHINFO_API_URL as string;

export const DEFAULT_CD_DELIVERY_FEE = 1000;

export interface CdDeliveryMailingAddress {
  id: string | null;
  userId: string | null;
  postalCode: string;
  baseAddress: string;
  detailAddress: string;
  receiverName: string | null;
  receiverPhone: string | null;
}

export interface CdDeliveryPaymentResponse {
  id: string;
  userId: string;
  price: {
    amount: number;
    taxFree: number;
    refundableAmount: number;
    refundableTaxFree: number;
  };
  paymentStatus: string;
  caseIds: string[];
  mailingAddress: CdDeliveryMailingAddress;
  mailStatus: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: {
    method: "POST" | "PUT";
    body?: unknown;
    getAccessToken: AccessTokenProvider;
  },
): Promise<T> {
  const authFetch = createAuthenticatedFetch(options.getAccessToken);
  const res = await authFetch(`${BASE_URL}${endpoint}`, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `API ${options.method} ${endpoint} 실패: ${res.status} ${res.statusText} ${errorText}`,
    );
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function requestCdDeliveryPayment(args: {
  caseIds: string[];
  mailingAddress: Partial<CdDeliveryMailingAddress>;
  deliveryFee: number;
  getAccessToken: AccessTokenProvider;
}): Promise<CdDeliveryPaymentResponse> {
  return apiRequest<CdDeliveryPaymentResponse>("cd-delivery/payment", {
    method: "POST",
    body: {
      caseIds: args.caseIds,
      mailingAddress: args.mailingAddress,
      deliveryFee: args.deliveryFee,
    },
    getAccessToken: args.getAccessToken,
  });
}

export interface CompleteCdDeliveryPaymentResult {
  ok: boolean;
  status: number;
}

export async function completeCdDeliveryPayment(
  paymentId: string,
  getAccessToken: AccessTokenProvider,
): Promise<CompleteCdDeliveryPaymentResult> {
  const authFetch = createAuthenticatedFetch(getAccessToken);
  const res = await authFetch(`${BASE_URL}cd-delivery/payment/${paymentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  return { ok: res.ok, status: res.status };
}
