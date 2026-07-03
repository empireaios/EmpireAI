/**
 * G2-09 — Commerce plugin EKLS integration.
 */

import { randomUUID } from "node:crypto";
import type {
  CommercePluginEklsObservationKind,
  CommercePluginEklsObservationRecord,
  CommercePluginEklsObservationResult,
} from "../contracts/commerce-plugin-integration-types.js";
import { validateCommercePluginPillowGovernance } from "../governance/commerce-plugin-pillow-governance.js";
import {
  validateCommercePluginEklsGovernance,
  validateCommercePluginObservationRecord,
} from "./commerce-plugin-ekls-pillow-governance.js";
import { getCommercePluginObservationStore } from "./commerce-plugin-observation-store.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function recordCommercePluginEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  pluginId: string;
  kind: CommercePluginEklsObservationKind;
  signalValue: number;
  signalUnit: CommercePluginEklsObservationRecord["signalUnit"];
  summary: string;
  pillowGovernance: true;
}): CommercePluginEklsObservationResult {
  const pillow = validateCommercePluginPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    pluginId: input.pluginId,
    operation: "monitor",
    pillowGovernance: true,
    brainRouted: true,
  });

  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateCommercePluginEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    operation: "store",
  });

  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: CommercePluginEklsObservationRecord = {
    observationId: randomUUID(),
    pluginId: input.pluginId,
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

  const quality = validateCommercePluginObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getCommercePluginObservationStore().save(record);

  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Commerce plugin observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchCommercePluginEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  pluginId?: string;
  kind?: CommercePluginEklsObservationKind;
  pillowGovernance: true;
}): CommercePluginEklsObservationRecord[] {
  const governance = validateCommercePluginEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });

  if (!governance.allowed) return [];

  return getCommercePluginObservationStore()
    .list(input.workspaceId, input.pluginId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
