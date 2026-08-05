import type { ScheduleStore } from "./schedule-store.js";
import type { SchedulingMetrics } from "./types.js";

export class MetricsCollector {
  collect(store: ScheduleStore): SchedulingMetrics {
    const schedules = store.listSchedules();
    const executions = store.listExecutions();
    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(
        (s) => !s.paused && (s.currentStatus === "active" || s.currentStatus === "draft"),
      ).length,
      totalExecutions: executions.length,
      completedExecutions: executions.filter((e) => e.status === "completed").length,
      missedExecutions: executions.filter((e) => e.status === "missed").length,
      totalConflicts: store.listConflicts().length,
      totalEventTriggers: store.listEventTriggers().length,
      totalReports: store.listReports().length,
    };
  }
}
