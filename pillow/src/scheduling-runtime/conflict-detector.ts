import { SCHRT_METADATA_VERSION } from "./paths.js";
import { nextSchrtId, type ScheduleStore } from "./schedule-store.js";
import { WindowCoordinator } from "./window-coordinator.js";
import type { ConflictRecord, ScheduleDefinition } from "./types.js";

/**
 * Overlapping schedules sharing missionId/workerId in the same window → conflict.
 */
export class ConflictDetector {
  private readonly windows = new WindowCoordinator();

  detect(store: ScheduleStore, nowIso: string): ConflictRecord[] {
    const active = store
      .listSchedules()
      .filter(
        (s) =>
          !s.paused &&
          (s.currentStatus === "active" ||
            s.currentStatus === "draft" ||
            s.currentStatus === "triggered" ||
            s.currentStatus === "conflicted"),
      );

    const found: ConflictRecord[] = [];
    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const a = active[i]!;
        const b = active[j]!;
        if (a.missionId !== b.missionId && a.workerId !== b.workerId) continue;
        if (a.missionId !== b.missionId || a.workerId !== b.workerId) continue;
        if (!this.pairOverlaps(a, b, nowIso)) continue;

        const windowStart = this.resolveWindowStart(a, b, nowIso);
        const windowEnd = this.resolveWindowEnd(a, b, nowIso);
        const conflict: ConflictRecord = {
          conflictId: nextSchrtId("schrt-cflt"),
          scheduleIds: [a.scheduleId, b.scheduleId].sort(),
          missionId: a.missionId,
          workerId: a.workerId,
          windowStartUtc: windowStart,
          windowEndUtc: windowEnd,
          detectedAt: nowIso,
          supportingEvidence: [
            `overlap:${a.scheduleId}+${b.scheduleId}`,
            `mission:${a.missionId}`,
            `worker:${a.workerId}`,
            "never_fabricated",
          ],
          auditReference: `audit://schrt/conflict/${a.scheduleId}-${b.scheduleId}`,
          fabricated: false,
          structuralSignalOnly: true,
          metadataVersion: SCHRT_METADATA_VERSION,
        };
        store.saveConflict(conflict);
        store.updateSchedule(a.scheduleId, { currentStatus: "conflicted" });
        store.updateSchedule(b.scheduleId, { currentStatus: "conflicted" });
        found.push(conflict);
      }
    }
    return found;
  }

  private pairOverlaps(a: ScheduleDefinition, b: ScheduleDefinition, nowIso: string): boolean {
    if (a.executionWindow && b.executionWindow) {
      return this.windows.windowsOverlap(a.executionWindow, b.executionWindow);
    }
    // Without explicit windows, same nextExecution instant (or both due at now) conflicts.
    if (a.nextExecution && b.nextExecution && a.nextExecution === b.nextExecution) {
      return true;
    }
    if (
      a.nextExecution &&
      b.nextExecution &&
      Date.parse(a.nextExecution) === Date.parse(nowIso) &&
      Date.parse(b.nextExecution) === Date.parse(nowIso)
    ) {
      return true;
    }
    // Same mission+worker both active with overlapping nextExecution within 1ms window
    if (a.nextExecution && b.nextExecution) {
      const aMs = Date.parse(a.nextExecution);
      const bMs = Date.parse(b.nextExecution);
      if (!Number.isNaN(aMs) && !Number.isNaN(bMs) && aMs === bMs) return true;
    }
    return false;
  }

  private resolveWindowStart(a: ScheduleDefinition, b: ScheduleDefinition, nowIso: string): string {
    if (a.executionWindow && b.executionWindow) {
      return Date.parse(a.executionWindow.startUtc) >= Date.parse(b.executionWindow.startUtc)
        ? a.executionWindow.startUtc
        : b.executionWindow.startUtc;
    }
    return a.nextExecution ?? b.nextExecution ?? nowIso;
  }

  private resolveWindowEnd(a: ScheduleDefinition, b: ScheduleDefinition, nowIso: string): string {
    if (a.executionWindow && b.executionWindow) {
      return Date.parse(a.executionWindow.endUtc) <= Date.parse(b.executionWindow.endUtc)
        ? a.executionWindow.endUtc
        : b.executionWindow.endUtc;
    }
    return a.nextExecution ?? b.nextExecution ?? nowIso;
  }
}
