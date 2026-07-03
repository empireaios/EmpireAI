/**
 * G5-02 — Pillow governance validation for automation triggers.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationTriggerGovernanceContext, TriggerIntakeRequest } from "../contracts/trigger-types.js";

export type PillowTriggerGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateTriggerIntakeStructure(intake: TriggerIntakeRequest): PillowTriggerGovernanceResult {
  if (!intake.pillowGovernance) {
    return { eligible: false, reason: "Pillow governance required — pillowGovernance must be true", eklsGoverned: false };
  }
  if (!intake.workspaceId?.trim()) {
    return { eligible: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!intake.actorId?.trim()) {
    return { eligible: false, reason: "actorId is required for auditability", eklsGoverned: false };
  }
  if (!intake.correlationId?.trim()) {
    return { eligible: false, reason: "correlationId is required for traceability", eklsGoverned: false };
  }
  return { eligible: true, reason: "Intake structure valid", eklsGoverned: false };
}

export function validateAutomationTriggerGovernance(
  context: AutomationTriggerGovernanceContext,
): PillowTriggerGovernanceResult {
  const structure = validateTriggerIntakeStructure({
    ...context,
    category: "manual_executive",
    correlationId: "governance-check",
  });
  if (!structure.eligible) {
    return structure;
  }

  if (context.killSwitchActive) {
    return {
      eligible: false,
      reason: "Global automation kill switch active — triggers blocked",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "business-automation",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return { eligible: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    eligible: true,
    reason: "Pillow policy, permissions, and EKLS workspace isolation passed",
    eklsGoverned: true,
  };
}
