/**
 * G7-07 — Autonomous learning integration (EKLS institutional memory).
 */

import { recordAutonomousEklsObservation } from "../ekls/autonomous-operations-ekls-integration.js";
import { GRAND_KING_ACCOUNT_HOLDER_ID } from "../../grand-king-live-operations/data/live-operations-profile-seed.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { listAutonomousOperations } from "./autonomous-operation-store.js";

export function recordAutonomousLearningBaseline(): void {
  const operations = listAutonomousOperations();
  const completed = operations.filter((op) => op.executionStatus === "completed").length;
  const failed = operations.filter((op) => op.executionStatus === "failed").length;

  recordAutonomousEklsObservation({
    actorId: GRAND_KING_ACCOUNT_HOLDER_ID,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    autonomousOperationId: "learning",
    ownerId: GRAND_KING_ACCOUNT_HOLDER_ID,
    kind: "autonomous_learning_recorded",
    summary: `Autonomous learning baseline — ${completed} completed, ${failed} failed`,
    pillowGovernance: true,
  });
}

export function recordOperationLearning(input: {
  autonomousOperationId: string;
  summary: string;
  actorId: string;
  ownerId: string;
}): void {
  recordAutonomousEklsObservation({
    actorId: input.actorId,
    workspaceId: GRAND_KING_WORKSPACE_ID,
    autonomousOperationId: input.autonomousOperationId,
    ownerId: input.ownerId,
    kind: "autonomous_learning_recorded",
    summary: input.summary,
    pillowGovernance: true,
  });
}
