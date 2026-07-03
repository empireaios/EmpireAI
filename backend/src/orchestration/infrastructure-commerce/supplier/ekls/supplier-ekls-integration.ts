/**
 * G2-03 — Supplier EKLS observation integration (Pillow-governed — no business logic).
 */

import { randomUUID } from "node:crypto";
import type {
  SupplierEklsObservationKind,
  SupplierEklsObservationRecord,
  SupplierEklsObservationResult,
} from "../contracts/supplier-integration-types.js";
import {
  validateSupplierEklsObservationGovernance,
  validateSupplierObservationRecord,
} from "./supplier-ekls-pillow-governance.js";
import { getSupplierObservationStore } from "./supplier-observation-store.js";
import { validateSupplierPillowGovernance } from "../governance/supplier-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordSupplierEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  supplierId: string;
  kind: SupplierEklsObservationKind;
  signalValue: number;
  signalUnit: SupplierEklsObservationRecord["signalUnit"];
  summary: string;
  pillowGovernance: true;
}): SupplierEklsObservationResult {
  const pillow = validateSupplierPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    supplierId: input.supplierId,
    operation: "monitor_health",
    pillowGovernance: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateSupplierEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: SupplierEklsObservationRecord = {
    observationId: randomUUID(),
    supplierId: input.supplierId,
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

  const quality = validateSupplierObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getSupplierObservationStore().save(record);

  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Supplier observation recorded through Pillow-governed EKLS channel",
    eklsGoverned: true,
  };
}

export function listSupplierEklsObservations(
  workspaceId?: string,
  supplierId?: string,
): SupplierEklsObservationRecord[] {
  return getSupplierObservationStore().list(workspaceId, supplierId);
}

export function searchSupplierEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  supplierId?: string;
  kind?: SupplierEklsObservationKind;
  pillowGovernance: true;
}): SupplierEklsObservationRecord[] {
  const governance = validateSupplierEklsObservationGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) {
    return [];
  }

  return getSupplierObservationStore()
    .list(input.workspaceId, input.supplierId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
