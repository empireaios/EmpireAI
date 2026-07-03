/**
 * G6-01 — Platform integrity EKLS integration.
 */

import { randomUUID } from "node:crypto";
import type { PlatformIntegrityEklsKind } from "../contracts/platform-integrity-types.js";
import { validatePlatformIntegrityPillowGovernance } from "../governance/platform-integrity-pillow-governance.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  getPlatformIntegrityObservationStore,
  type PlatformIntegrityEklsObservationRecord,
} from "./platform-integrity-observation-store.js";
import { PLATFORM_INTEGRITY_EKLS_KINDS } from "../contracts/platform-integrity-types.js";

export function recordPlatformIntegrityEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: PlatformIntegrityEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validatePlatformIntegrityPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "scan",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(PLATFORM_INTEGRITY_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown platform integrity EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: PlatformIntegrityEklsObservationRecord = {
    observationId: randomUUID(),
    scanId: input.scanId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    signalValue: input.signalValue ?? 1,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
    eklsChannel: "production-certification",
  };

  getPlatformIntegrityObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Platform integrity observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchPlatformIntegrityEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: PlatformIntegrityEklsKind;
  pillowGovernance: true;
}): PlatformIntegrityEklsObservationRecord[] {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "search",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return [];

  return getPlatformIntegrityObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listPlatformIntegrityEklsKinds(): readonly PlatformIntegrityEklsKind[] {
  return PLATFORM_INTEGRITY_EKLS_KINDS;
}
