/**
 * G2-05 — Pillow governance for payment EKLS outcomes (no credential storage).
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  PAYMENT_EKLS_OUTCOME_KINDS,
  type PaymentEklsOutcomeKind,
  type PaymentEklsOutcomeRecord,
} from "../contracts/payment-integration-types.js";

export type PaymentEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

const FORBIDDEN_RECORD_KEYS = ["pan", "cvv", "cardNumber", "accountNumber", "secretKey", "apiSecret"];

export function validatePaymentEklsOutcomeGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): PaymentEklsGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — direct EKLS writes forbidden",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: input.operation,
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { allowed: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    allowed: true,
    reason: "Payment EKLS outcome governance validated",
    eklsGoverned: true,
  };
}

export function validatePaymentOutcomeRecord(
  record: PaymentEklsOutcomeRecord,
): PaymentEklsGovernanceResult {
  if (!record.outcomeId?.trim()) {
    return { allowed: false, reason: "outcomeId is required", eklsGoverned: false };
  }
  if (!record.providerId?.trim()) {
    return { allowed: false, reason: "providerId is required", eklsGoverned: false };
  }
  if (!record.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!(PAYMENT_EKLS_OUTCOME_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown outcome kind: ${record.kind}`, eklsGoverned: false };
  }
  if (!Number.isFinite(record.signalValue)) {
    return { allowed: false, reason: "signalValue must be a finite number", eklsGoverned: false };
  }
  if (record.credentialFree !== true) {
    return {
      allowed: false,
      reason: "Payment EKLS outcomes must be credential-free",
      eklsGoverned: false,
    };
  }

  const serialized = JSON.stringify(record).toLowerCase();
  for (const key of FORBIDDEN_RECORD_KEYS) {
    if (serialized.includes(key.toLowerCase())) {
      return {
        allowed: false,
        reason: `Payment EKLS outcome must not contain sensitive key: ${key}`,
        eklsGoverned: false,
      };
    }
  }

  return { allowed: true, reason: "Payment outcome record quality validated", eklsGoverned: false };
}

export function listPaymentEklsOutcomeKinds(): readonly PaymentEklsOutcomeKind[] {
  return PAYMENT_EKLS_OUTCOME_KINDS;
}
