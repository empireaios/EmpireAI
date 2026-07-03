/**
 * G5-04 — Pillow governance for workflow orchestration and execution.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import type { QueuedAutomationRequest } from "../contracts/scheduler-types.js";
import type { AutomationRun, OrchestratorAdvanceOptions, OrchestratorPickupOptions } from "../contracts/orchestrator-types.js";

export type PillowOrchestratorGovernanceResult = {
  eligible: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateOrchestratorGovernanceContext(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
}): PillowOrchestratorGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      eligible: false,
      reason: "Pillow governance required — pillowGovernance must be true",
      eklsGoverned: false,
    };
  }
  if (!input.actorId?.trim()) {
    return { eligible: false, reason: "actorId is required for auditability", eklsGoverned: false };
  }
  if (!input.workspaceId?.trim()) {
    return { eligible: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (input.killSwitchActive) {
    return {
      eligible: false,
      reason: "Global automation kill switch active — execution blocked",
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
      operation: "store",
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { eligible: false, reason: ekls.reason, eklsGoverned: false };
  }

  return {
    eligible: true,
    reason: "Execution eligibility, policy compliance, and workspace isolation passed",
    eklsGoverned: true,
  };
}

export function validatePickupRequest(
  queueEntry: QueuedAutomationRequest,
  options: OrchestratorPickupOptions,
): PillowOrchestratorGovernanceResult {
  const governance = validateOrchestratorGovernanceContext({
    pillowGovernance: true,
    actorId: options.actorId,
    workspaceId: queueEntry.workspaceId,
    companyId: queueEntry.companyId,
    killSwitchActive: options.killSwitchActive,
  });
  if (!governance.eligible) return governance;

  if (queueEntry.executionState !== "waiting") {
    return {
      eligible: false,
      reason: `Queue entry must be in waiting state — current: ${queueEntry.executionState}`,
      eklsGoverned: governance.eklsGoverned,
    };
  }

  if (!queueEntry.orchestratorHandoffReady) {
    return {
      eligible: false,
      reason: "Queue entry not ready for orchestrator pickup",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  if (queueEntry.approvalReference?.startsWith("pending") || queueEntry.approvalReference?.includes("routed")) {
    return {
      eligible: false,
      reason: "Approval compliance pending — execution blocked",
      eklsGoverned: governance.eklsGoverned,
    };
  }

  return governance;
}

export function validateAdvanceRequest(
  run: AutomationRun,
  options: OrchestratorAdvanceOptions,
): PillowOrchestratorGovernanceResult {
  const governance = validateOrchestratorGovernanceContext({
    pillowGovernance: true,
    actorId: options.actorId,
    workspaceId: run.executionContext.workspaceId,
    companyId: run.executionContext.companyId,
    killSwitchActive: options.killSwitchActive,
  });
  if (!governance.eligible) return governance;

  if (
    run.lifecycleState === "workflow_completed" ||
    run.lifecycleState === "workflow_failed" ||
    run.lifecycleState === "workflow_cancelled"
  ) {
    return {
      eligible: false,
      reason: `Run is terminal — lifecycle state: ${run.lifecycleState}`,
      eklsGoverned: governance.eklsGoverned,
    };
  }

  return governance;
}
