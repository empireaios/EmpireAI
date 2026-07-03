/**
 * G7-07 — Autonomous operation store.
 */

import type { AutonomousExecutionStatus, AutonomousOperation } from "../contracts/autonomous-operations-types.js";
import { isValidAutonomousTransition } from "../contracts/autonomous-operations-types.js";

const store = new Map<string, AutonomousOperation>();
const history: Array<{
  entryId: string;
  autonomousOperationId: string;
  executionStatus: AutonomousExecutionStatus;
  summary: string;
  timestamp: string;
}> = [];

export function resetAutonomousOperationStoreForTests(): void {
  store.clear();
  history.length = 0;
}

export function appendAutonomousOperation(operation: AutonomousOperation): void {
  store.set(operation.autonomousOperationId, operation);
}

export function getAutonomousOperation(autonomousOperationId: string): AutonomousOperation | undefined {
  return store.get(autonomousOperationId);
}

export function listAutonomousOperations(): AutonomousOperation[] {
  return [...store.values()];
}

export function transitionAutonomousOperationStatus(
  autonomousOperationId: string,
  targetStatus: AutonomousExecutionStatus,
  summary?: string,
): AutonomousOperation {
  const operation = store.get(autonomousOperationId);
  if (!operation) {
    throw new Error(`Autonomous operation not found: ${autonomousOperationId}`);
  }
  if (!isValidAutonomousTransition(operation.executionStatus, targetStatus)) {
    throw new Error(`Invalid autonomous transition: ${operation.executionStatus} -> ${targetStatus}`);
  }
  const updated: AutonomousOperation = {
    ...operation,
    executionStatus: targetStatus,
    updatedAt: new Date().toISOString(),
    governanceState:
      targetStatus === "completed"
        ? "pillow-completed"
        : targetStatus === "failed"
          ? "pillow-failed"
          : operation.governanceState,
  };
  store.set(autonomousOperationId, updated);
  history.push({
    entryId: `hist-${autonomousOperationId}-${Date.now()}`,
    autonomousOperationId,
    executionStatus: targetStatus,
    summary: summary ?? `Transitioned to ${targetStatus}`,
    timestamp: updated.updatedAt,
  });
  return updated;
}

export function listAutonomousOperationHistory() {
  return [...history];
}

export function updateAutonomousOperation(operation: AutonomousOperation): void {
  store.set(operation.autonomousOperationId, operation);
}

export function updateAutonomousOperationHealth(
  autonomousOperationId: string,
  healthStatus: AutonomousOperation["healthStatus"],
): AutonomousOperation {
  const operation = store.get(autonomousOperationId);
  if (!operation) {
    throw new Error(`Autonomous operation not found: ${autonomousOperationId}`);
  }
  const updated = { ...operation, healthStatus, updatedAt: new Date().toISOString() };
  store.set(autonomousOperationId, updated);
  return updated;
}
