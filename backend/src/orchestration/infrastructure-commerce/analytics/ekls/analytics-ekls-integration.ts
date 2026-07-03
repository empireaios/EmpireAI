/**
 * G2-07 — Analytics EKLS observation integration (Pillow-governed — no executive reasoning).
 */

import { randomUUID } from "node:crypto";
import type {
  AnalyticsEklsObservationKind,
  AnalyticsEklsObservationRecord,
  AnalyticsEklsObservationResult,
} from "../contracts/analytics-integration-types.js";
import {
  validateAnalyticsEklsObservationGovernance,
  validateAnalyticsObservationRecord,
} from "./analytics-ekls-pillow-governance.js";
import { getAnalyticsObservationStore } from "./analytics-observation-store.js";
import { validateAnalyticsPillowGovernance } from "../governance/analytics-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordAnalyticsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  analyticsId: string;
  kind: AnalyticsEklsObservationKind;
  signalValue: number;
  signalUnit: AnalyticsEklsObservationRecord["signalUnit"];
  summary: string;
  evidenceRef?: string;
  pillowGovernance: true;
}): AnalyticsEklsObservationResult {
  const pillow = validateAnalyticsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    analyticsId: input.analyticsId,
    operation: "publish",
    pillowGovernance: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateAnalyticsEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: AnalyticsEklsObservationRecord = {
    observationId: randomUUID(),
    analyticsId: input.analyticsId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    signalValue: input.signalValue,
    signalUnit: input.signalUnit,
    summary: input.summary,
    evidenceRef: input.evidenceRef,
    recordedAt: nowIso(),
    pillowGoverned: true,
    eklsChannel: "infrastructure-commerce",
  };

  const quality = validateAnalyticsObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getAnalyticsObservationStore().save(record);

  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Analytics observation recorded through Pillow-governed EKLS channel",
    eklsGoverned: true,
  };
}

export function listAnalyticsEklsObservations(
  workspaceId?: string,
  analyticsId?: string,
): AnalyticsEklsObservationRecord[] {
  return getAnalyticsObservationStore().list(workspaceId, analyticsId);
}

export function searchAnalyticsEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  analyticsId?: string;
  kind?: AnalyticsEklsObservationKind;
  pillowGovernance: true;
}): AnalyticsEklsObservationRecord[] {
  const governance = validateAnalyticsEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) {
    return [];
  }

  return getAnalyticsObservationStore()
    .list(input.workspaceId, input.analyticsId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
