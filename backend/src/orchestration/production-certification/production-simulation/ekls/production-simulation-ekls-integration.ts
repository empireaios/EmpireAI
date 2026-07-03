/**
 * G6-09 — Production simulation EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  PRODUCTION_SIMULATION_EKLS_KINDS,
  type ProductionSimulationEklsKind,
} from "../contracts/production-simulation-types.js";
import { validateProductionSimulationPillowGovernance } from "../governance/production-simulation-pillow-governance.js";
import {
  getProductionSimulationObservationStore,
  type ProductionSimulationEklsObservationRecord,
} from "./production-simulation-observation-store.js";

export function recordProductionSimulationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  runId: string;
  kind: ProductionSimulationEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateProductionSimulationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_full",
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

  if (!(PRODUCTION_SIMULATION_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown simulation EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: ProductionSimulationEklsObservationRecord = {
    observationId: randomUUID(),
    runId: input.runId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    signalValue: input.signalValue ?? 1,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
    eklsChannel: "production-certification",
  };

  getProductionSimulationObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Simulation observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchProductionSimulationEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  runId?: string;
  kind?: ProductionSimulationEklsKind;
  pillowGovernance: true;
}): ProductionSimulationEklsObservationRecord[] {
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

  return getProductionSimulationObservationStore()
    .list(input.workspaceId, input.runId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listProductionSimulationEklsKinds(): readonly ProductionSimulationEklsKind[] {
  return PRODUCTION_SIMULATION_EKLS_KINDS;
}
