/** R2-13 — Return fixtures (structural — no live HTTP). */

import type {
  ReturnCompletionStatus,
  ReturnReason,
  ReturnShipmentStatus,
  SupportedSupplierIdentifier,
} from "./types.js";

export function buildReturnId(seed?: string): string {
  const suffix = seed ? seed.replace(/[^a-z0-9]/gi, "").slice(0, 12) : Date.now().toString(36);
  return `rm-${suffix}`;
}

export function buildReturnLabelReference(returnId: string): string {
  return `rm-label-${returnId.replace("rm-", "")}`;
}

export function buildReturnTrackingNumber(returnId: string): string {
  return `RTRK-${returnId.replace("rm-", "").toUpperCase().slice(0, 12)}`;
}

export function resolveSupplierFromOrder(orderReference: string): SupportedSupplierIdentifier {
  if (orderReference.includes("ali")) return "aliexpress";
  if (orderReference.includes("1688")) return "1688";
  return "cj";
}

export function getFixtureReturnStatus(mode: "in_transit" | "received" | "failed"): {
  returnShipmentStatus: ReturnShipmentStatus;
  returnCompletionStatus: ReturnCompletionStatus;
} {
  if (mode === "received") {
    return { returnShipmentStatus: "received", returnCompletionStatus: "completed" };
  }
  if (mode === "failed") {
    return { returnShipmentStatus: "failed", returnCompletionStatus: "failed" };
  }
  return { returnShipmentStatus: "in_transit", returnCompletionStatus: "processing" };
}

export const DEFAULT_RETURN_REASON: ReturnReason = "defective";
