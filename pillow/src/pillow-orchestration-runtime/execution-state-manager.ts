import { POR_METADATA_VERSION } from "./paths.js";
import type { ExecutionStatus } from "./types.js";

export type ExecutionStateRecord = {
  stateId: string;
  sessionId: string;
  status: ExecutionStatus | string;
  updatedAt: string;
  notes: string[];
  metadataVersion: string;
};

export class ExecutionStateManager {
  private states = new Map<string, ExecutionStateRecord>();

  update(sessionId: string, status: ExecutionStatus | string, notes: string[] = []) {
    const record: ExecutionStateRecord = {
      stateId: `por-state-${sessionId}`,
      sessionId,
      status,
      updatedAt: new Date().toISOString(),
      notes: [...notes],
      metadataVersion: POR_METADATA_VERSION,
    };
    this.states.set(sessionId, record);
    return record;
  }

  get(sessionId: string) {
    const state = this.states.get(sessionId);
    return state ? { ...state, notes: [...state.notes] } : null;
  }

  list() {
    return [...this.states.values()].map((s) => ({ ...s, notes: [...s.notes] }));
  }
}
