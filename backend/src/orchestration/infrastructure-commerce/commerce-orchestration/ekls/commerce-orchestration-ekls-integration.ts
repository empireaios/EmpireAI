/**
 * G2-08 — Commerce orchestration EKLS integration.
 */

import { randomUUID } from "node:crypto";
import type {
  CommerceOrchestrationEklsObservationKind,
  CommerceOrchestrationEklsObservationRecord,
  CommerceOrchestrationEklsObservationResult,
} from "../contracts/commerce-orchestration-types.js";
import {
  validateCommerceOrchestrationEklsGovernance,
  validateCommerceOrchestrationObservationRecord,
} from "./commerce-orchestration-ekls-pillow-governance.js";
import { getCommerceOrchestrationObservationStore } from "./commerce-orchestration-observation-store.js";
import { validateCommerceOrchestrationPillowGovernance } from "../governance/commerce-orchestration-pillow-governance.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordCommerceOrchestrationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  profileId: string;
  orchestrationId: string;
  kind: CommerceOrchestrationEklsObservationKind;
  signalValue: number;
  signalUnit: CommerceOrchestrationEklsObservationRecord["signalUnit"];
  summary: string;
  evidenceRef?: string;
  pillowGovernance: true;
}): CommerceOrchestrationEklsObservationResult {
  const pillow = validateCommerceOrchestrationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    profileId: input.profileId,
    operation: "monitor",
    pillowGovernance: true,
    brainRouted: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateCommerceOrchestrationEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: CommerceOrchestrationEklsObservationRecord = {
    observationId: randomUUID(),
    profileId: input.profileId,
    orchestrationId: input.orchestrationId,
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

  const quality = validateCommerceOrchestrationObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getCommerceOrchestrationObservationStore().save(record);

  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Commerce orchestration observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchCommerceOrchestrationEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  profileId?: string;
  kind?: CommerceOrchestrationEklsObservationKind;
  pillowGovernance: true;
}): CommerceOrchestrationEklsObservationRecord[] {
  const governance = validateCommerceOrchestrationEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) return [];

  return getCommerceOrchestrationObservationStore()
    .list(input.workspaceId, input.profileId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
