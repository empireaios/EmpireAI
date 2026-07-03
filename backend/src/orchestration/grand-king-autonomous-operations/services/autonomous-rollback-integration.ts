/**
 * G7-07 — Autonomous rollback integration.
 */

import { randomUUID } from "node:crypto";
import { recordAutonomousEklsObservation } from "../ekls/autonomous-operations-ekls-integration.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { validateAutonomousOperationsPillowGovernance } from "../governance/autonomous-operations-pillow-governance.js";
import { getAutonomousOperation, transitionAutonomousOperationStatus, updateAutonomousOperation } from "./autonomous-operation-store.js";
import type { AutonomousOperation } from "../contracts/autonomous-operations-types.js";

export function rollbackAutonomousOperation(input: {
  autonomousOperationId: string;
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
}): AutonomousOperation {
  const pillow = validateAutonomousOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "rollback",
    pillowGovernance: true,
  });
  if (!pillow.allowed || !pillow.rollbackEligibility) {
    throw new Error(pillow.reason);
  }

  const operation = getAutonomousOperation(input.autonomousOperationId);
  if (!operation) {
    throw new Error(`Autonomous operation not found: ${input.autonomousOperationId}`);
  }

  const recovered = transitionAutonomousOperationStatus(
    input.autonomousOperationId,
    operation.executionStatus === "failed" ? "recovered" : "cancelled",
    "Autonomous operation rolled back",
  );

  const withRollback: AutonomousOperation = {
    ...recovered,
    rollbackReference: `rollback:${randomUUID()}`,
    evidence: [
      ...recovered.evidence,
      {
        evidenceId: `ev-rollback-${recovered.autonomousOperationId}`,
        kind: "rollback",
        summary: "Autonomous operation rolled back under Pillow governance",
        ref: recovered.rollbackReference,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  recordAutonomousEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    autonomousOperationId: withRollback.autonomousOperationId,
    ownerId: input.ownerId,
    kind: operation.executionStatus === "failed" ? "autonomous_operation_recovered" : "autonomous_operation_cancelled",
    summary: `Rollback applied for ${withRollback.operationType}`,
    pillowGovernance: true,
  });

  updateAutonomousOperation(withRollback);
  return withRollback;
}

export function failAutonomousOperation(input: {
  autonomousOperationId: string;
  actorId: string;
  ownerId: string;
  reason: string;
}): AutonomousOperation {
  const failed = transitionAutonomousOperationStatus(
    input.autonomousOperationId,
    "failed",
    input.reason,
  );

  recordAutonomousEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    autonomousOperationId: failed.autonomousOperationId,
    ownerId: input.ownerId,
    kind: "autonomous_operation_failed",
    summary: input.reason,
    pillowGovernance: true,
  });

  return failed;
}
