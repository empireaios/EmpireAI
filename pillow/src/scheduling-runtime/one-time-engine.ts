import type { ScheduleDefinition } from "./types.js";

/**
 * One-time schedule engine — nextExecution only from explicit input or deterministic
 * offset from provided now. Never fabricates past completions.
 */
export class OneTimeEngine {
  resolveNextExecution(input: {
    nextExecution?: string | null;
    now?: string;
  }): string | null {
    if (input.nextExecution) {
      const ms = Date.parse(input.nextExecution);
      if (Number.isNaN(ms)) {
        throw new Error("Invalid nextExecution ISO for one_time schedule");
      }
      return new Date(ms).toISOString();
    }
    if (input.now) {
      const ms = Date.parse(input.now);
      if (Number.isNaN(ms)) {
        throw new Error("Invalid now ISO for one_time schedule");
      }
      // Deterministic default: one hour after provided now (structural placeholder only).
      return new Date(ms + 60 * 60 * 1000).toISOString();
    }
    return null;
  }

  isDue(schedule: ScheduleDefinition, nowIso: string): boolean {
    if (schedule.scheduleType !== "one_time") return false;
    if (schedule.paused || schedule.currentStatus === "cancelled") return false;
    if (schedule.currentStatus === "completed") return false;
    if (!schedule.nextExecution) return false;
    const nextMs = Date.parse(schedule.nextExecution);
    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nextMs) || Number.isNaN(nowMs)) return false;
    return nowMs >= nextMs;
  }
}
