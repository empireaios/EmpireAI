/**
 * Amazon SP-API merchant-fulfilled shipment confirmation.
 * Closes the confirmShipment gap for first-dollar fulfilment readiness.
 * READY — AWAITING FIRST REAL ORDER until exercised by a genuine order.
 */
import { httpTransport } from "../reality-integration/live-commerce/http-transport.js";
import type { AmazonSession } from "./amazon-commerce-preflight.js";

export type ConfirmAmazonShipmentInput = {
  orderId: string;
  marketplaceId: string;
  packageDetail: {
    packageReferenceId: string;
    carrierCode: string;
    carrierName?: string;
    trackingNumber: string;
    shipDate: string;
    orderItems: Array<{ orderItemId: string; quantity: number }>;
  };
  codCollectionMethod?: string;
};

export type ConfirmAmazonShipmentResult = {
  ok: boolean;
  status: "CONFIRMED" | "FAILED" | "DRY_RUN";
  httpStatus: number | null;
  errors: string[];
  raw: unknown;
  note: string;
};

/**
 * POST /orders/v0/orders/{orderId}/shipmentConfirmation
 * Does not invent tracking — caller must supply real CJ tracking evidence.
 */
export async function confirmAmazonMerchantShipment(
  session: AmazonSession,
  input: ConfirmAmazonShipmentInput,
  options?: { dryRun?: boolean },
): Promise<ConfirmAmazonShipmentResult> {
  if (options?.dryRun) {
    return {
      ok: true,
      status: "DRY_RUN",
      httpStatus: null,
      errors: [],
      raw: { dryRun: true, input },
      note: "Dry-run only — no Amazon mutation. READY — AWAITING FIRST REAL ORDER.",
    };
  }

  if (!input.packageDetail.trackingNumber?.trim()) {
    return {
      ok: false,
      status: "FAILED",
      httpStatus: null,
      errors: ["trackingNumber required — never confirm shipment without tracking evidence"],
      raw: null,
      note: "Blocked: no tracking evidence",
    };
  }

  const url = `${session.endpoint}/orders/v0/orders/${encodeURIComponent(input.orderId)}/shipmentConfirmation`;
  const body = {
    marketplaceId: input.marketplaceId || session.marketplaceId,
    packageDetail: input.packageDetail,
    ...(input.codCollectionMethod ? { codCollectionMethod: input.codCollectionMethod } : {}),
  };

  const response = await httpTransport({
    url,
    method: "POST",
    headers: {
      "x-amz-access-token": session.accessToken,
      "Content-Type": "application/json",
    },
    body,
  });

  const json = response.json as { errors?: Array<{ message?: string; code?: string }> };
  const errors =
    json.errors?.map((e) => e.message || e.code || "error").filter(Boolean) ??
    (!response.ok ? [`HTTP ${response.status}`] : []);

  return {
    ok: response.ok || response.status === 202 || response.status === 204,
    status: response.ok || response.status === 202 || response.status === 204 ? "CONFIRMED" : "FAILED",
    httpStatus: response.status,
    errors,
    raw: json,
    note: "Amazon merchant-fulfilled shipment confirmation attempt",
  };
}

/** Idempotency key for Amazon order → CJ supplier order (never duplicate). */
export function amazonCjFulfillmentIdempotencyKey(input: {
  amazonOrderId: string;
  orderItemId: string;
  amazonSellerSku: string;
}): string {
  return `amz:${input.amazonOrderId}|item:${input.orderItemId}|sku:${input.amazonSellerSku}`;
}
