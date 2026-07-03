/**
 * G7-08 — Automatic recovery coordinator.
 */

import { recordSelfHealingEklsObservation } from "../ekls/self-healing-ekls-integration.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { validateSelfHealingPillowGovernance } from "../governance/self-healing-pillow-governance.js";
import type { HealingActionRecord } from "../contracts/self-healing-types.js";
import { getHealingAction, transitionHealingStatus, updateHealingAction } from "./healing-action-store.js";
import { evaluateDependencyHealth } from "./dependency-health-evaluator.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { collectHealingEvidence } from "./healing-evidence-collector.js";

export function executeHealingAction(input: {
  healingId: string;
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}): HealingActionRecord {
  const pillow = validateSelfHealingPillowGovernance({
    ...input,
    operation: "execute",
  });
  if (!pillow.allowed) throw new Error(pillow.reason);

  const record = getHealingAction(input.healingId);
  if (!record) throw new Error(`Healing action not found: ${input.healingId}`);

  if (record.executionStatus === "approval_pending") {
    throw new Error("Healing action requires approval before execution");
  }

  const deps = evaluateDependencyHealth(record.domainId, input.context);
  if (!deps.healthy) {
    return transitionHealingStatus(input.healingId, "failed", deps.reason);
  }

  recordSelfHealingEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    healingId: input.healingId,
    ownerId: input.ownerId,
    kind: "self_healing_started",
    summary: `Executing ${record.healingAction} on ${record.targetSubsystem}`,
    pillowGovernance: true,
  });

  transitionHealingStatus(input.healingId, "executing", "executing");

  const evidence = collectHealingEvidence(record);
  const completed = transitionHealingStatus(
    input.healingId,
    "completed",
    `${record.healingAction}_completed`,
  );
  const withEvidence: HealingActionRecord = {
    ...completed,
    evidence: [...completed.evidence, ...evidence],
    updatedAt: new Date().toISOString(),
  };
  updateHealingAction(withEvidence);

  recordSelfHealingEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    healingId: input.healingId,
    ownerId: input.ownerId,
    kind: "self_healing_completed",
    summary: withEvidence.result,
    pillowGovernance: true,
  });

  recordSelfHealingEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    healingId: input.healingId,
    ownerId: input.ownerId,
    kind: "production_health_restored",
    summary: `Production health restored for ${record.domainId}`,
    pillowGovernance: true,
  });

  return withEvidence;
}

export function pauseHealingAction(input: {
  healingId: string;
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
}): HealingActionRecord {
  const pillow = validateSelfHealingPillowGovernance({ ...input, operation: "pause" });
  if (!pillow.allowed) throw new Error(pillow.reason);
  return transitionHealingStatus(input.healingId, "paused", "healing_paused");
}
