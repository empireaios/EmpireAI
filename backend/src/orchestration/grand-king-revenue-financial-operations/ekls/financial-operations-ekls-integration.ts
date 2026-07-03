/**
 * G7-05 — Financial operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import { FINANCIAL_EKLS_KINDS, type FinancialEklsKind } from "../contracts/financial-operations-types.js";
import { validateFinancialOperationsPillowGovernance } from "../governance/financial-operations-pillow-governance.js";
import {
  appendFinancialObservation,
  searchFinancialObservations,
} from "./financial-operations-observation-store.js";

export function recordFinancialEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  financialRecordId: string;
  ownerId: string;
  kind: FinancialEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateFinancialOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "record",
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
      consumerChannel: "grand-king-revenue-financial-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(FINANCIAL_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendFinancialObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    financialRecordId: input.financialRecordId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Financial operations EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchFinancialEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  financialRecordId?: string;
  kind?: FinancialEklsKind;
  pillowGovernance: true;
}) {
  return searchFinancialObservations(input);
}

export function listFinancialEklsKinds(): readonly FinancialEklsKind[] {
  return FINANCIAL_EKLS_KINDS;
}
