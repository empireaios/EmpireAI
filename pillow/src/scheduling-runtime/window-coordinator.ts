import type { ExecutionWindow, ScheduleDefinition } from "./types.js";

/**
 * Coordinates execution windows and maintenance windows.
 * Due schedules inside a maintenance window are deferred (not fabricated as completed).
 */
export class WindowCoordinator {
  isWithinWindow(schedule: ScheduleDefinition, nowIso: string): boolean {
    if (!schedule.executionWindow) return true;
    const nowMs = Date.parse(nowIso);
    const startMs = Date.parse(schedule.executionWindow.startUtc);
    const endMs = Date.parse(schedule.executionWindow.endUtc);
    if (Number.isNaN(nowMs) || Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
    return nowMs >= startMs && nowMs <= endMs;
  }

  isInMaintenance(nowIso: string, maintenanceWindows: ExecutionWindow[] = []): boolean {
    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) return false;
    return maintenanceWindows.some((w) => {
      const startMs = Date.parse(w.startUtc);
      const endMs = Date.parse(w.endUtc);
      if (Number.isNaN(startMs) || Number.isNaN(endMs)) return false;
      return nowMs >= startMs && nowMs <= endMs;
    });
  }

  canFire(
    schedule: ScheduleDefinition,
    nowIso: string,
    maintenanceWindows: ExecutionWindow[] = [],
  ): boolean {
    if (this.isInMaintenance(nowIso, maintenanceWindows)) return false;
    return this.isWithinWindow(schedule, nowIso);
  }

  windowsOverlap(a: ExecutionWindow, b: ExecutionWindow): boolean {
    const aStart = Date.parse(a.startUtc);
    const aEnd = Date.parse(a.endUtc);
    const bStart = Date.parse(b.startUtc);
    const bEnd = Date.parse(b.endUtc);
    if ([aStart, aEnd, bStart, bEnd].some((v) => Number.isNaN(v))) return false;
    return aStart <= bEnd && bStart <= aEnd;
  }
}
