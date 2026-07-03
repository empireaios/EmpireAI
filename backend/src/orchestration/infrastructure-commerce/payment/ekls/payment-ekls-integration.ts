/**
 * G2-05 — Payment EKLS outcome integration (Pillow-governed — no credentials stored).
 */

import { randomUUID } from "node:crypto";
import type {
  PaymentEklsOutcomeKind,
  PaymentEklsOutcomeRecord,
  PaymentEklsOutcomeResult,
} from "../contracts/payment-integration-types.js";
import {
  validatePaymentEklsOutcomeGovernance,
  validatePaymentOutcomeRecord,
} from "./payment-ekls-pillow-governance.js";
import { getPaymentOutcomeStore } from "./payment-outcome-store.js";
import { validatePaymentPillowGovernance } from "../governance/payment-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordPaymentEklsOutcome(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  providerId: string;
  kind: PaymentEklsOutcomeKind;
  signalValue: number;
  signalUnit: PaymentEklsOutcomeRecord["signalUnit"];
  summary: string;
  pillowGovernance: true;
}): PaymentEklsOutcomeResult {
  const pillow = validatePaymentPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    providerId: input.providerId,
    operation: "monitor",
    pillowGovernance: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validatePaymentEklsOutcomeGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: PaymentEklsOutcomeRecord = {
    outcomeId: randomUUID(),
    providerId: input.providerId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    signalValue: input.signalValue,
    signalUnit: input.signalUnit,
    summary: input.summary,
    recordedAt: nowIso(),
    pillowGoverned: true,
    eklsChannel: "infrastructure-commerce",
    credentialFree: true,
  };

  const quality = validatePaymentOutcomeRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getPaymentOutcomeStore().save(record);

  return {
    accepted: true,
    outcomeId: record.outcomeId,
    reason: "Payment outcome recorded through Pillow-governed EKLS channel",
    eklsGoverned: true,
  };
}

export function listPaymentEklsOutcomes(
  workspaceId?: string,
  providerId?: string,
): PaymentEklsOutcomeRecord[] {
  return getPaymentOutcomeStore().list(workspaceId, providerId);
}

export function searchPaymentEklsOutcomes(input: {
  actorId: string;
  workspaceId: string;
  providerId?: string;
  kind?: PaymentEklsOutcomeKind;
  pillowGovernance: true;
}): PaymentEklsOutcomeRecord[] {
  const governance = validatePaymentEklsOutcomeGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) {
    return [];
  }

  return getPaymentOutcomeStore()
    .list(input.workspaceId, input.providerId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
