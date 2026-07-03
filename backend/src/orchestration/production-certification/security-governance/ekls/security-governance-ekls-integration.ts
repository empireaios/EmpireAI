/**
 * G6-02 — Security governance EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  SECURITY_GOVERNANCE_EKLS_KINDS,
  type SecurityGovernanceEklsKind,
} from "../contracts/security-governance-types.js";
import { validateSecurityGovernancePillowGovernance } from "../governance/security-governance-pillow-governance.js";
import {
  getSecurityGovernanceObservationStore,
  type SecurityGovernanceEklsObservationRecord,
} from "./security-governance-observation-store.js";

export function recordSecurityGovernanceEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: SecurityGovernanceEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateSecurityGovernancePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "security_scan",
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

  if (!(SECURITY_GOVERNANCE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown security governance EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: SecurityGovernanceEklsObservationRecord = {
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

  getSecurityGovernanceObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Security governance observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchSecurityGovernanceEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: SecurityGovernanceEklsKind;
  pillowGovernance: true;
}): SecurityGovernanceEklsObservationRecord[] {
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

  return getSecurityGovernanceObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listSecurityGovernanceEklsKinds(): readonly SecurityGovernanceEklsKind[] {
  return SECURITY_GOVERNANCE_EKLS_KINDS;
}
