/**
 * G6-03 — Infrastructure deployment EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS,
  type InfrastructureDeploymentEklsKind,
} from "../contracts/infrastructure-deployment-types.js";
import { validateInfrastructureDeploymentPillowGovernance } from "../governance/infrastructure-deployment-pillow-governance.js";
import {
  getInfrastructureDeploymentObservationStore,
  type InfrastructureDeploymentEklsObservationRecord,
} from "./infrastructure-deployment-observation-store.js";

export function recordInfrastructureDeploymentEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: InfrastructureDeploymentEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateInfrastructureDeploymentPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "deployment_scan",
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

  if (!(INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown deployment EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: InfrastructureDeploymentEklsObservationRecord = {
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

  getInfrastructureDeploymentObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Infrastructure deployment observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchInfrastructureDeploymentEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: InfrastructureDeploymentEklsKind;
  pillowGovernance: true;
}): InfrastructureDeploymentEklsObservationRecord[] {
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

  return getInfrastructureDeploymentObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listInfrastructureDeploymentEklsKinds(): readonly InfrastructureDeploymentEklsKind[] {
  return INFRASTRUCTURE_DEPLOYMENT_EKLS_KINDS;
}
