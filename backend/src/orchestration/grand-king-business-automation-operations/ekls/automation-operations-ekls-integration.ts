/**
 * G7-03 — Automation operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  AUTOMATION_OPERATIONS_EKLS_KINDS,
  type AutomationOperationsEklsKind,
} from "../contracts/automation-operations-types.js";
import { validateAutomationOperationsPillowGovernance } from "../governance/automation-operations-pillow-governance.js";
import {
  appendAutomationOperationsObservation,
  searchAutomationOperationsObservations,
} from "./automation-operations-observation-store.js";

export function recordAutomationOperationsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  automationOperationId: string;
  ownerId: string;
  kind: AutomationOperationsEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateAutomationOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "start",
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
      consumerChannel: "grand-king-business-automation-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(AUTOMATION_OPERATIONS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendAutomationOperationsObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    automationOperationId: input.automationOperationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Automation operations EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchAutomationOperationsEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  automationOperationId?: string;
  kind?: AutomationOperationsEklsKind;
  pillowGovernance: true;
}) {
  return searchAutomationOperationsObservations(input);
}

export function listAutomationOperationsEklsKinds(): readonly AutomationOperationsEklsKind[] {
  return AUTOMATION_OPERATIONS_EKLS_KINDS;
}
