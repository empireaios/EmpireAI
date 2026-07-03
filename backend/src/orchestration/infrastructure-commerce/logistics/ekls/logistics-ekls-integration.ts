/**
 * G2-06 — Logistics EKLS observation integration (Pillow-governed — no business logic).
 */

import { randomUUID } from "node:crypto";
import type {
  LogisticsEklsObservationKind,
  LogisticsEklsObservationRecord,
  LogisticsEklsObservationResult,
} from "../contracts/logistics-integration-types.js";
import {
  validateLogisticsEklsObservationGovernance,
  validateLogisticsObservationRecord,
} from "./logistics-ekls-pillow-governance.js";
import { getLogisticsObservationStore } from "./logistics-observation-store.js";
import { validateLogisticsPillowGovernance } from "../governance/logistics-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordLogisticsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  providerId: string;
  kind: LogisticsEklsObservationKind;
  signalValue: number;
  signalUnit: LogisticsEklsObservationRecord["signalUnit"];
  summary: string;
  pillowGovernance: true;
}): LogisticsEklsObservationResult {
  const pillow = validateLogisticsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    providerId: input.providerId,
    operation: "track_shipment",
    pillowGovernance: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateLogisticsEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: LogisticsEklsObservationRecord = {
    observationId: randomUUID(),
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
  };

  const quality = validateLogisticsObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getLogisticsObservationStore().save(record);

  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Logistics observation recorded through Pillow-governed EKLS channel",
    eklsGoverned: true,
  };
}

export function listLogisticsEklsObservations(
  workspaceId?: string,
  providerId?: string,
): LogisticsEklsObservationRecord[] {
  return getLogisticsObservationStore().list(workspaceId, providerId);
}

export function searchLogisticsEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  providerId?: string;
  kind?: LogisticsEklsObservationKind;
  pillowGovernance: true;
}): LogisticsEklsObservationRecord[] {
  const governance = validateLogisticsEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) {
    return [];
  }

  return getLogisticsObservationStore()
    .list(input.workspaceId, input.providerId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
