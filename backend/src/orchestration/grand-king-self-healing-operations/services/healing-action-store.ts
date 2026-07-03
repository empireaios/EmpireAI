/**
 * G7-08 — Healing action store.
 */

import type { HealingActionRecord, HealingExecutionStatus } from "../contracts/self-healing-types.js";
import { isValidHealingTransition } from "../contracts/self-healing-types.js";

const store = new Map<string, HealingActionRecord>();
const history: Array<{ healingId: string; executionStatus: HealingExecutionStatus; result: string; timestamp: string }> = [];

export function resetHealingStoreForTests(): void {
  store.clear();
  history.length = 0;
}

export function appendHealingAction(record: HealingActionRecord): void {
  store.set(record.healingId, record);
}

export function getHealingAction(healingId: string): HealingActionRecord | undefined {
  return store.get(healingId);
}

export function listHealingActions(): HealingActionRecord[] {
  return [...store.values()];
}

export function transitionHealingStatus(
  healingId: string,
  targetStatus: HealingExecutionStatus,
  result?: string,
): HealingActionRecord {
  const record = store.get(healingId);
  if (!record) throw new Error(`Healing action not found: ${healingId}`);
  if (!isValidHealingTransition(record.executionStatus, targetStatus)) {
    throw new Error(`Invalid healing transition: ${record.executionStatus} -> ${targetStatus}`);
  }
  const updated: HealingActionRecord = {
    ...record,
    executionStatus: targetStatus,
    result: result ?? record.result,
    updatedAt: new Date().toISOString(),
    governanceState: targetStatus === "completed" ? "pillow-healed" : record.governanceState,
  };
  store.set(healingId, updated);
  history.push({
    healingId,
    executionStatus: targetStatus,
    result: updated.result,
    timestamp: updated.updatedAt,
  });
  return updated;
}

export function updateHealingAction(record: HealingActionRecord): void {
  store.set(record.healingId, record);
}

export function listHealingHistory() {
  return [...history];
}
