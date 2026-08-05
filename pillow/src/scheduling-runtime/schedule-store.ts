import type {
  ConflictRecord,
  EventTriggerRecord,
  ScheduleDefinition,
  ScheduleExecution,
  SchedulingRuntimeReport,
} from "./types.js";

let sequence = 0;

export function resetSchrtSequenceForTesting() {
  sequence = 0;
}

export function nextSchrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}

/**
 * Scheduling store. NEVER deletes scheduling history.
 * History is append-only for schedules, executions, conflicts, event triggers, reports.
 */
export class ScheduleStore {
  private schedules = new Map<string, ScheduleDefinition>();
  private executions: ScheduleExecution[] = [];
  private conflicts: ConflictRecord[] = [];
  private eventTriggers: EventTriggerRecord[] = [];
  private reports: SchedulingRuntimeReport[] = [];
  private scheduleHistory: ScheduleDefinition[] = [];
  private executionHistory: ScheduleExecution[] = [];
  private auditTrail: string[] = [];

  saveSchedule(schedule: ScheduleDefinition) {
    const snapshot = this.cloneSchedule(schedule);
    this.schedules.set(schedule.scheduleId, snapshot);
    this.scheduleHistory.push(this.cloneSchedule(schedule));
    this.auditTrail.push(`schedule_saved:${schedule.scheduleId}@${new Date().toISOString()}`);
    return snapshot;
  }

  getSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    return schedule ? this.cloneSchedule(schedule) : null;
  }

  listSchedules() {
    return [...this.schedules.values()]
      .map((s) => this.cloneSchedule(s))
      .sort((a, b) => a.scheduleId.localeCompare(b.scheduleId));
  }

  updateSchedule(scheduleId: string, patch: Partial<ScheduleDefinition>) {
    const existing = this.schedules.get(scheduleId);
    if (!existing) return null;
    const updated: ScheduleDefinition = {
      ...existing,
      ...patch,
      retryPolicy: patch.retryPolicy
        ? { ...patch.retryPolicy }
        : { ...existing.retryPolicy },
      executionWindow: patch.executionWindow !== undefined
        ? patch.executionWindow
          ? { ...patch.executionWindow }
          : null
        : existing.executionWindow
          ? { ...existing.executionWindow }
          : null,
      fabricated: false,
      structuralSignalOnly: true,
    };
    this.schedules.set(scheduleId, updated);
    this.scheduleHistory.push(this.cloneSchedule(updated));
    this.auditTrail.push(`schedule_updated:${scheduleId}@${new Date().toISOString()}`);
    return this.cloneSchedule(updated);
  }

  saveExecution(execution: ScheduleExecution) {
    const snapshot = this.cloneExecution(execution);
    this.executions.push(snapshot);
    this.executionHistory.push(this.cloneExecution(execution));
    this.auditTrail.push(`execution_saved:${execution.executionId}@${execution.executedAt}`);
    return snapshot;
  }

  listExecutions() {
    return this.executions.map((e) => this.cloneExecution(e));
  }

  saveConflict(conflict: ConflictRecord) {
    const snapshot = this.cloneConflict(conflict);
    this.conflicts.push(snapshot);
    this.auditTrail.push(`conflict_saved:${conflict.conflictId}@${conflict.detectedAt}`);
    return snapshot;
  }

  listConflicts() {
    return this.conflicts.map((c) => this.cloneConflict(c));
  }

  saveEventTrigger(trigger: EventTriggerRecord) {
    const snapshot = this.cloneEventTrigger(trigger);
    this.eventTriggers.push(snapshot);
    this.auditTrail.push(`event_trigger_saved:${trigger.eventTriggerId}@${trigger.triggeredAt}`);
    return snapshot;
  }

  listEventTriggers() {
    return this.eventTriggers.map((t) => this.cloneEventTrigger(t));
  }

  saveReport(report: SchedulingRuntimeReport) {
    this.reports.push({
      ...report,
      activeSchedules: report.activeSchedules.map((s) => this.cloneSchedule(s)),
      upcomingExecutions: report.upcomingExecutions.map((s) => this.cloneSchedule(s)),
      completedExecutions: report.completedExecutions.map((e) => this.cloneExecution(e)),
      missedExecutions: report.missedExecutions.map((e) => this.cloneExecution(e)),
      eventTriggers: report.eventTriggers.map((t) => this.cloneEventTrigger(t)),
      schedulingStatistics: {
        ...report.schedulingStatistics,
        supportingEvidence: [...report.schedulingStatistics.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      conflictSummary: {
        ...report.conflictSummary,
        supportingEvidence: [...report.conflictSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      supportingEvidence: [...report.supportingEvidence],
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      schedules: this.listSchedules(),
      scheduleHistory: this.scheduleHistory.map((s) => this.cloneSchedule(s)),
      executions: this.listExecutions(),
      executionHistory: this.executionHistory.map((e) => this.cloneExecution(e)),
      conflicts: this.listConflicts(),
      eventTriggers: this.listEventTriggers(),
      reports: this.listReports(),
    };
  }

  private cloneSchedule(schedule: ScheduleDefinition): ScheduleDefinition {
    return {
      ...schedule,
      retryPolicy: { ...schedule.retryPolicy },
      executionWindow: schedule.executionWindow
        ? { ...schedule.executionWindow }
        : null,
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneExecution(execution: ScheduleExecution): ScheduleExecution {
    return {
      ...execution,
      supportingEvidence: [...execution.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneConflict(conflict: ConflictRecord): ConflictRecord {
    return {
      ...conflict,
      scheduleIds: [...conflict.scheduleIds],
      supportingEvidence: [...conflict.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }

  private cloneEventTrigger(trigger: EventTriggerRecord): EventTriggerRecord {
    return {
      ...trigger,
      supportingEvidence: [...trigger.supportingEvidence],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}
