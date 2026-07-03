/**
 * G6-06 — Performance EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { PERFORMANCE_EKLS_KINDS, type PerformanceEklsKind } from "../contracts/performance-certification-types.js";
import { validatePerformancePillowGovernance } from "../governance/performance-pillow-governance.js";
import {
  getPerformanceObservationStore,
  type PerformanceEklsObservationRecord,
} from "./performance-observation-store.js";

export function recordPerformanceEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: PerformanceEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validatePerformancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "performance_scan",
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

  if (!(PERFORMANCE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown performance EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: PerformanceEklsObservationRecord = {
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

  getPerformanceObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Performance observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchPerformanceEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: PerformanceEklsKind;
  pillowGovernance: true;
}): PerformanceEklsObservationRecord[] {
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

  return getPerformanceObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listPerformanceEklsKinds(): readonly PerformanceEklsKind[] {
  return PERFORMANCE_EKLS_KINDS;
}
