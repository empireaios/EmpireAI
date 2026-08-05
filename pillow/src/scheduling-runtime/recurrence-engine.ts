import type { ScheduleDefinition, ScheduleType } from "./types.js";

/**
 * Deterministic recurrence engine.
 * Same schedule + same now ISO → same nextExecution.
 * Cron support: only "M H * * *" (minute hour) — no external deps.
 */
export class RecurrenceEngine {
  computeNextExecution(
    scheduleType: ScheduleType,
    nowIso: string,
    opts: {
      cronExpression?: string | null;
      fromExecution?: string | null;
    } = {},
  ): string | null {
    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) {
      throw new Error("Invalid now ISO for deterministic recurrence");
    }

    switch (scheduleType) {
      case "daily":
        return this.nextDaily(nowMs, opts.fromExecution);
      case "weekly":
        return this.nextWeekly(nowMs, opts.fromExecution);
      case "monthly":
        return this.nextMonthly(nowMs, opts.fromExecution);
      case "cron":
        return this.nextCron(nowMs, opts.cronExpression ?? null);
      case "delayed":
        return this.nextDaily(nowMs, opts.fromExecution);
      default:
        return null;
    }
  }

  advanceAfterExecution(schedule: ScheduleDefinition, nowIso: string): string | null {
    if (
      schedule.scheduleType === "daily" ||
      schedule.scheduleType === "weekly" ||
      schedule.scheduleType === "monthly" ||
      schedule.scheduleType === "cron" ||
      schedule.scheduleType === "delayed"
    ) {
      // Advance from the fired slot (previous nextExecution) or now — never fabricate.
      const anchor = schedule.nextExecution ?? nowIso;
      const afterMs = Date.parse(anchor);
      if (Number.isNaN(afterMs)) return null;
      // Compute next strictly after the fired execution instant.
      const afterIso = new Date(afterMs + 1).toISOString();
      return this.computeNextExecution(schedule.scheduleType, afterIso, {
        cronExpression: schedule.cronExpression,
        fromExecution: schedule.nextExecution,
      });
    }
    return null;
  }

  private nextDaily(nowMs: number, fromExecution?: string | null): string {
    if (fromExecution) {
      const fromMs = Date.parse(fromExecution);
      if (!Number.isNaN(fromMs) && fromMs > nowMs) return new Date(fromMs).toISOString();
      if (!Number.isNaN(fromMs)) {
        return new Date(fromMs + 24 * 60 * 60 * 1000).toISOString();
      }
    }
    const d = new Date(nowMs);
    // Next calendar day at same UTC hour/minute/second as now.
    const next = new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0),
    );
    return next.toISOString();
  }

  private nextWeekly(nowMs: number, fromExecution?: string | null): string {
    if (fromExecution) {
      const fromMs = Date.parse(fromExecution);
      if (!Number.isNaN(fromMs) && fromMs > nowMs) return new Date(fromMs).toISOString();
      if (!Number.isNaN(fromMs)) {
        return new Date(fromMs + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    return new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  private nextMonthly(nowMs: number, fromExecution?: string | null): string {
    if (fromExecution) {
      const fromMs = Date.parse(fromExecution);
      if (!Number.isNaN(fromMs) && fromMs > nowMs) return new Date(fromMs).toISOString();
      if (!Number.isNaN(fromMs)) {
        const f = new Date(fromMs);
        return new Date(
          Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, f.getUTCDate(), f.getUTCHours(), f.getUTCMinutes(), f.getUTCSeconds(), 0),
        ).toISOString();
      }
    }
    const d = new Date(nowMs);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), 0),
    ).toISOString();
  }

  /**
   * Simple cron "M H * * *" — next occurrence of minute/hour on or after now (UTC).
   */
  private nextCron(nowMs: number, cronExpression: string | null): string | null {
    if (!cronExpression) return null;
    const match = cronExpression.trim().match(/^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/);
    if (!match) return null;
    const minute = Number(match[1]);
    const hour = Number(match[2]);
    if (minute < 0 || minute > 59 || hour < 0 || hour > 23) return null;

    const now = new Date(nowMs);
    let candidate = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hour,
      minute,
      0,
      0,
    );
    if (candidate < nowMs) {
      candidate += 24 * 60 * 60 * 1000;
    }
    return new Date(candidate).toISOString();
  }
}
