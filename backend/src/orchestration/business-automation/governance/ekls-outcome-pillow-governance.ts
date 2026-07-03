/**
 * G5-08 — Pillow governance for EKLS outcome learning records.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { AutomationLearningRecord } from "../contracts/ekls-outcome-types.js";

export type EklsOutcomeGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateEklsOutcomeGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): EklsOutcomeGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — direct EKLS writes forbidden",
      eklsGoverned: false,
    };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      consumerChannel: "business-automation",
      operation: input.operation,
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { allowed: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    allowed: true,
    reason: "Knowledge quality, governance, permissions, and workspace isolation validated",
    eklsGoverned: true,
  };
}

export function validateLearningRecordQuality(record: AutomationLearningRecord): EklsOutcomeGovernanceResult {
  if (!record.learningId?.trim()) {
    return { allowed: false, reason: "learningId is required", eklsGoverned: false };
  }
  if (!record.executionId?.trim()) {
    return { allowed: false, reason: "executionId is required", eklsGoverned: false };
  }
  if (!record.workflowId?.trim()) {
    return { allowed: false, reason: "workflowId is required", eklsGoverned: false };
  }
  if (record.confidence < 0 || record.confidence > 1) {
    return { allowed: false, reason: "confidence must be between 0 and 1", eklsGoverned: false };
  }
  return {
    allowed: true,
    reason: "Learning record quality validated",
    eklsGoverned: true,
  };
}
