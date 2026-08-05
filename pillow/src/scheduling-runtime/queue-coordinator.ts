import type { QueueRuntimeHandle } from "./integrations.js";
import type { ScheduleDefinition } from "./types.js";

export type QueueCoordinateResult = {
  queueRef: string;
  probed: boolean;
  called: boolean;
  notes: string[];
};

/**
 * Structural enqueue signal to Queue Runtime handle only.
 * NEVER replaces Queue Runtime.
 */
export class QueueCoordinator {
  enqueueSignal(
    handle: QueueRuntimeHandle | undefined,
    schedule: ScheduleDefinition,
    nowIso: string,
  ): QueueCoordinateResult {
    const queueRef = `queue://schrt/enqueue/${schedule.scheduleId}@${nowIso}`;
    if (!handle) {
      return {
        queueRef,
        probed: true,
        called: false,
        notes: ["queue_runtime unavailable — structural queueRef recorded only"],
      };
    }

    let called = false;
    const notes: string[] = ["queue_runtime probed structurally"];

    if (typeof handle.enqueue === "function") {
      handle.enqueue({
        structuralSignalOnly: true,
        fabricated: false,
        scheduleId: schedule.scheduleId,
        missionId: schedule.missionId,
        queueRef,
        source: "scheduling-runtime",
        neverReplaceQueueRuntime: true,
      });
      called = true;
      notes.push("enqueue structural signal sent");
    }

    if (typeof handle.produceReport === "function") {
      handle.produceReport({
        structuralSignalOnly: true,
        scheduleId: schedule.scheduleId,
        queueRef,
        source: "scheduling-runtime",
      });
      called = true;
      notes.push("produceReport presence probed");
    }

    if (!called && typeof handle.getQ1005ConsumableContract === "function") {
      handle.getQ1005ConsumableContract();
      called = true;
      notes.push("getQ1005ConsumableContract presence probed");
    }

    if (!called) {
      notes.push("queue_runtime present — structural queueRef only; never replaces queue");
    }

    return { queueRef, probed: true, called, notes };
  }
}
