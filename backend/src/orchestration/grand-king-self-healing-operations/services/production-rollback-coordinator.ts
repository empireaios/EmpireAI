/**
 * G7-08 — Production rollback coordinator.
 */

import { randomUUID } from "node:crypto";
import type { HealingActionRecord } from "../contracts/self-healing-types.js";
import { recordSelfHealingEklsObservation } from "../ekls/self-healing-ekls-integration.js";
import { validateSelfHealingPillowGovernance } from "../governance/self-healing-pillow-governance.js";
import { getHealingAction, transitionHealingStatus, updateHealingAction } from "./healing-action-store.js";

export function coordinateProductionRollback(input: {
  healingId: string;
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
}): HealingActionRecord {
  const pillow = validateSelfHealingPillowGovernance({
    ...input,
    operation: "rollback",
  });
  if (!pillow.allowed || !pillow.rollbackAuthority) {
    throw new Error(pillow.reason);
  }

  const record = getHealingAction(input.healingId);
  if (!record) throw new Error(`Healing action not found: ${input.healingId}`);

  const rollbackRef = `rollback:${randomUUID()}`;
  const updated: HealingActionRecord = {
    ...record,
    rollbackReference: rollbackRef,
    result: "rollback_coordinated",
    evidence: [
      ...record.evidence,
      {
        evidenceId: `ev-rollback-${input.healingId}`,
        kind: "rollback",
        summary: "Production rollback coordinated under Pillow governance",
        ref: rollbackRef,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
  updateHealingAction(updated);

  recordSelfHealingEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    healingId: input.healingId,
    ownerId: input.ownerId,
    kind: "self_healing_cancelled",
    summary: `Rollback coordinated for ${record.healingAction}`,
    pillowGovernance: true,
  });

  return transitionHealingStatus(input.healingId, "cancelled", "rollback_coordinated");
}
