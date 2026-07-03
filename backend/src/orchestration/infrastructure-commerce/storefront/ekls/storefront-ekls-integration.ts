/**
 * G2-04 — Storefront EKLS outcome integration (Pillow-governed — no business logic).
 */

import { randomUUID } from "node:crypto";
import type {
  StorefrontEklsOutcomeKind,
  StorefrontEklsOutcomeRecord,
  StorefrontEklsOutcomeResult,
} from "../contracts/storefront-integration-types.js";
import {
  validateStorefrontEklsOutcomeGovernance,
  validateStorefrontOutcomeRecord,
} from "./storefront-ekls-pillow-governance.js";
import { getStorefrontOutcomeStore } from "./storefront-outcome-store.js";
import { validateStorefrontPillowGovernance } from "../governance/storefront-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordStorefrontEklsOutcome(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  storefrontId: string;
  kind: StorefrontEklsOutcomeKind;
  signalValue: number;
  signalUnit: StorefrontEklsOutcomeRecord["signalUnit"];
  summary: string;
  pillowGovernance: true;
}): StorefrontEklsOutcomeResult {
  const pillow = validateStorefrontPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storefrontId: input.storefrontId,
    operation: "monitor",
    pillowGovernance: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateStorefrontEklsOutcomeGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: StorefrontEklsOutcomeRecord = {
    outcomeId: randomUUID(),
    storefrontId: input.storefrontId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    signalValue: input.signalValue,
    signalUnit: input.signalUnit,
    summary: input.summary,
    recordedAt: nowIso(),
    pillowGoverned: true,
    eklsChannel: "infrastructure-commerce",
  };

  const quality = validateStorefrontOutcomeRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getStorefrontOutcomeStore().save(record);

  return {
    accepted: true,
    outcomeId: record.outcomeId,
    reason: "Storefront outcome recorded through Pillow-governed EKLS channel",
    eklsGoverned: true,
  };
}

export function listStorefrontEklsOutcomes(
  workspaceId?: string,
  storefrontId?: string,
): StorefrontEklsOutcomeRecord[] {
  return getStorefrontOutcomeStore().list(workspaceId, storefrontId);
}

export function searchStorefrontEklsOutcomes(input: {
  actorId: string;
  workspaceId: string;
  storefrontId?: string;
  kind?: StorefrontEklsOutcomeKind;
  pillowGovernance: true;
}): StorefrontEklsOutcomeRecord[] {
  const governance = validateStorefrontEklsOutcomeGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) {
    return [];
  }

  return getStorefrontOutcomeStore()
    .list(input.workspaceId, input.storefrontId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
