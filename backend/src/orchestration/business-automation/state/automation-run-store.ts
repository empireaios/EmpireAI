/**
 * G5-04 — Automation run state store (in-memory — distributed-ready interface).
 */

import type { AutomationRun, RunSnapshot } from "../contracts/orchestrator-types.js";

const runStore = new Map<string, AutomationRun>();

export class AutomationRunStore {
  save(run: AutomationRun): AutomationRun {
    runStore.set(run.executionId, run);
    return run;
  }

  getById(executionId: string): AutomationRun | undefined {
    return runStore.get(executionId);
  }

  getByQueueId(queueId: string): AutomationRun | undefined {
    for (const run of runStore.values()) {
      if (run.queueId === queueId) return run;
    }
    return undefined;
  }

  list(workspaceId?: string): AutomationRun[] {
    const runs = [...runStore.values()];
    if (!workspaceId) return runs;
    return runs.filter((run) => run.executionContext.workspaceId === workspaceId);
  }

  snapshot(workspaceId?: string): RunSnapshot {
    const runs = this.list(workspaceId);
    return {
      workspaceId,
      totalRuns: runs.length,
      runs,
      generatedAt: new Date().toISOString(),
    };
  }

  resetForTests(): void {
    runStore.clear();
  }
}

let sharedStore: AutomationRunStore | undefined;

export function getAutomationRunStore(): AutomationRunStore {
  if (!sharedStore) {
    sharedStore = new AutomationRunStore();
  }
  return sharedStore;
}

export function resetAutomationRunStoreForTests(): void {
  sharedStore = undefined;
  runStore.clear();
}
