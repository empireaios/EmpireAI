/**
 * G5-03 — Automation Queue (ordering, priority, state — no workflow execution).
 */

import type {
  QueuedAutomationRequest,
  QueueExecutionState,
  QueueSnapshot,
} from "../contracts/scheduler-types.js";

const PRIORITY_RANK: Record<QueuedAutomationRequest["priority"], number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const queueStore: QueuedAutomationRequest[] = [];

function compareQueueEntries(a: QueuedAutomationRequest, b: QueuedAutomationRequest): number {
  const priorityDelta = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (priorityDelta !== 0) return priorityDelta;
  const timeDelta = Date.parse(a.scheduledTime) - Date.parse(b.scheduledTime);
  if (timeDelta !== 0) return timeDelta;
  return a.createdAt.localeCompare(b.createdAt);
}

export class AutomationQueue {
  enqueue(entry: QueuedAutomationRequest): QueuedAutomationRequest {
    if (queueStore.some((item) => item.queueId === entry.queueId)) {
      throw new Error(`Duplicate queue id: ${entry.queueId}`);
    }
    queueStore.push(entry);
    queueStore.sort(compareQueueEntries);
    return entry;
  }

  getById(queueId: string): QueuedAutomationRequest | undefined {
    return queueStore.find((item) => item.queueId === queueId);
  }

  updateState(queueId: string, executionState: QueueExecutionState): QueuedAutomationRequest {
    const entry = this.getById(queueId);
    if (!entry) {
      throw new Error(`Queue entry not found: ${queueId}`);
    }
    entry.executionState = executionState;
    if (executionState === "queued") {
      entry.orchestratorHandoffReady = true;
    }
    if (executionState === "waiting") {
      entry.orchestratorHandoffReady = true;
    }
    queueStore.sort(compareQueueEntries);
    return entry;
  }

  list(filter?: {
    workspaceId?: string;
    executionState?: QueueExecutionState;
  }): QueuedAutomationRequest[] {
    return queueStore
      .filter((item) => {
        if (filter?.workspaceId && item.workspaceId !== filter.workspaceId) return false;
        if (filter?.executionState && item.executionState !== filter.executionState) return false;
        return true;
      })
      .sort(compareQueueEntries);
  }

  listDue(nowIso: string, executionState: QueueExecutionState = "scheduled"): QueuedAutomationRequest[] {
    const now = Date.parse(nowIso);
    return this.list({ executionState }).filter((item) => Date.parse(item.scheduledTime) <= now);
  }

  dequeueReadyForOrchestrator(nowIso: string): QueuedAutomationRequest | undefined {
    const ready = this.list({ executionState: "queued" }).find((item) => {
      return Date.parse(item.scheduledTime) <= Date.parse(nowIso) && item.orchestratorHandoffReady;
    });
    return ready;
  }

  snapshot(workspaceId?: string): QueueSnapshot {
    const entries = this.list(workspaceId ? { workspaceId } : undefined);
    const byState = {} as Record<QueueExecutionState, number>;
    for (const state of [
      "pending",
      "scheduled",
      "queued",
      "waiting",
      "running",
      "paused",
      "retrying",
      "completed",
      "failed",
      "cancelled",
      "recovered",
      "archived",
    ] as QueueExecutionState[]) {
      byState[state] = entries.filter((item) => item.executionState === state).length;
    }
    return {
      workspaceId,
      totalCount: entries.length,
      byState,
      entries,
      generatedAt: new Date().toISOString(),
    };
  }

  resetForTests(): void {
    queueStore.length = 0;
  }
}

let sharedQueue: AutomationQueue | undefined;

export function getAutomationQueue(): AutomationQueue {
  if (!sharedQueue) {
    sharedQueue = new AutomationQueue();
  }
  return sharedQueue;
}

export function resetAutomationQueueForTests(): void {
  sharedQueue = undefined;
  queueStore.length = 0;
}
