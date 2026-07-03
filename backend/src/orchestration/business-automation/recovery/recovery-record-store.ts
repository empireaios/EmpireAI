/**
 * G5-06 — Recovery & rollback record store.
 */

import type { RecoveryRecord, RollbackContext } from "../contracts/recovery-types.js";

const recoveryStore = new Map<string, RecoveryRecord>();
const rollbackStore = new Map<string, RollbackContext>();

export class RecoveryRecordStore {
  saveRecovery(record: RecoveryRecord): RecoveryRecord {
    recoveryStore.set(record.recoveryId, record);
    return record;
  }

  getRecovery(recoveryId: string): RecoveryRecord | undefined {
    return recoveryStore.get(recoveryId);
  }

  getRecoveryByExecution(executionId: string): RecoveryRecord | undefined {
    for (const record of recoveryStore.values()) {
      if (record.executionId === executionId) return record;
    }
    return undefined;
  }

  listRecoveries(workspaceId?: string): RecoveryRecord[] {
    return [...recoveryStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      return true;
    });
  }

  saveRollback(context: RollbackContext): RollbackContext {
    rollbackStore.set(context.rollbackId, context);
    return context;
  }

  listRollbacks(workspaceId?: string): RollbackContext[] {
    return [...rollbackStore.values()].filter((context) => {
      if (workspaceId && context.workspaceId !== workspaceId) return false;
      return true;
    });
  }

  resetForTests(): void {
    recoveryStore.clear();
    rollbackStore.clear();
  }
}

let sharedStore: RecoveryRecordStore | undefined;

export function getRecoveryRecordStore(): RecoveryRecordStore {
  if (!sharedStore) {
    sharedStore = new RecoveryRecordStore();
  }
  return sharedStore;
}

export function resetRecoveryRecordStoreForTests(): void {
  sharedStore = undefined;
  recoveryStore.clear();
  rollbackStore.clear();
}
