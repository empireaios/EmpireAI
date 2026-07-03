/**
 * G7-07 — Autonomous execution scheduler.
 */

import type { AutonomousOperation } from "../contracts/autonomous-operations-types.js";
import { recordAutonomousEklsObservation } from "../ekls/autonomous-operations-ekls-integration.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { transitionAutonomousOperationStatus, updateAutonomousOperation } from "./autonomous-operation-store.js";
import { validateAutonomousSafety } from "./autonomous-safety-validator.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";

export function scheduleAutonomousOperation(input: {
  operation: AutonomousOperation;
  actorId: string;
  ownerId: string;
  context?: RegistryLoaderContext;
}): AutonomousOperation {
  const safety = validateAutonomousSafety(input.operation, input.context);
  if (!safety.safe) {
    return transitionAutonomousOperationStatus(
      input.operation.autonomousOperationId,
      "blocked",
      safety.reason,
    );
  }

  const current = input.operation.executionStatus;
  const scheduled =
    current === "scheduled"
      ? input.operation
      : transitionAutonomousOperationStatus(
          input.operation.autonomousOperationId,
          "scheduled",
          "Autonomous operation scheduled",
        );

  if (current !== "scheduled") {
    recordAutonomousEklsObservation({
      actorId: input.actorId,
      workspaceId: GRAND_KING_WORKSPACE_ID,
      autonomousOperationId: scheduled.autonomousOperationId,
      ownerId: input.ownerId,
      kind: "autonomous_operation_started",
      summary: `Scheduled ${scheduled.operationType}`,
      pillowGovernance: true,
    });
  }

  return scheduled;
}

export function startAutonomousExecution(input: {
  autonomousOperationId: string;
  actorId: string;
  ownerId: string;
  context?: RegistryLoaderContext;
}): AutonomousOperation {
  const running = transitionAutonomousOperationStatus(input.autonomousOperationId, "running", "Execution started");
  return running;
}

export function completeAutonomousExecution(input: {
  autonomousOperationId: string;
  executedAction: string;
  actorId: string;
  ownerId: string;
}): AutonomousOperation {
  const operation = transitionAutonomousOperationStatus(
    input.autonomousOperationId,
    "completed",
    input.executedAction,
  );
  const completed: AutonomousOperation = {
    ...operation,
    executedAction: input.executedAction,
    updatedAt: new Date().toISOString(),
  };

  recordAutonomousEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    autonomousOperationId: completed.autonomousOperationId,
    ownerId: input.ownerId,
    kind: "autonomous_operation_completed",
    summary: input.executedAction,
    pillowGovernance: true,
  });

  updateAutonomousOperation(completed);
  return completed;
}
