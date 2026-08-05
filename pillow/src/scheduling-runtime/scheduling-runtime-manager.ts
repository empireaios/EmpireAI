import type { SchedulingRuntimeConfiguration } from "./configuration.js";
import {
  SchrtIntegrationCoordinator,
  type SchedulingRuntimeDependencies,
} from "./integrations.js";
import { appendSchrtLog } from "./schrt-logging.js";
import { ScheduleStore, nextSchrtId } from "./schedule-store.js";
import { ScheduleValidator } from "./schedule-validator.js";
import { ScheduleRegistry } from "./schedule-registry.js";
import { RecurrenceEngine } from "./recurrence-engine.js";
import { EventTriggerEngine } from "./event-trigger-engine.js";
import { WindowCoordinator } from "./window-coordinator.js";
import { ConflictDetector } from "./conflict-detector.js";
import { MissionTrigger } from "./mission-trigger.js";
import { QueueCoordinator } from "./queue-coordinator.js";
import { MetricsCollector } from "./metrics-collector.js";
import { ReportBuilder } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  SCHRT_CAPABILITIES,
  SCHRT_METADATA_VERSION,
  SCHEDULING_RUNTIME_ID,
  SCHRT_SEED_CLOCK_UTC,
} from "./paths.js";
import type {
  ConflictRecord,
  EventTriggerRecord,
  IntegrationHandshake,
  Q1013ConsumableContract,
  ScheduleDefinition,
  ScheduleExecution,
  SchrtEngineRecord,
  SchrtInput,
  SchrtRunReport,
  SchrtValidationReport,
  ScheduleStatus,
} from "./types.js";

export class SchedulingRuntimeManager {
  private engineRecord: SchrtEngineRecord | null = null;
  private seeded = false;
  private readonly store = new ScheduleStore();
  private readonly validator = new ScheduleValidator();
  private readonly registry = new ScheduleRegistry();
  private readonly recurrence = new RecurrenceEngine();
  private readonly eventTrigger = new EventTriggerEngine();
  private readonly windows = new WindowCoordinator();
  private readonly conflictDetector = new ConflictDetector();
  private readonly missionTrigger = new MissionTrigger();
  private readonly queueCoordinator = new QueueCoordinator();
  private readonly metricsCollector = new MetricsCollector();
  private readonly reportBuilder = new ReportBuilder();
  private readonly integrations = new SchrtIntegrationCoordinator();

  bindIntegrations(deps: SchedulingRuntimeDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getDependencies();
  }

  ensureSeeded(config: SchedulingRuntimeConfiguration) {
    if (this.seeded) return;
    this.seeded = true;
    this.registry.seedDefaults(this.store, config);
    this.ensureRecord("active", config);
    appendSchrtLog({
      event: "seed_schedules",
      details: `Seeded 5 schedules from ${SCHRT_SEED_CLOCK_UTC} — no fabricated past completions`,
    });
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getHistory() {
    return this.store.getHistory();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getQ1013ConsumableContract(config: SchedulingRuntimeConfiguration): Q1013ConsumableContract {
    return this.reportBuilder.buildQ1013ConsumableContract(config);
  }

  connect(_input: Record<string, unknown>, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    appendSchrtLog({
      event: "connect",
      details: `Scheduling Runtime connected; integrations=${handshakes.filter((h) => h.available).length}`,
    });
    return this.reportAction(
      "connect",
      started,
      { validated: true },
      config,
      null,
      this.store.listSchedules(),
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      handshakes,
    );
  }

  createSchedule(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateCreate(input, started);
    if (validation.decision === "fail") {
      return this.failReport("create_schedule", started, validation, config);
    }
    const schedule = this.registry.create(this.store, input, config);
    this.ensureRecord("active", config);
    appendSchrtLog({
      event: "create_schedule",
      details: `${schedule.scheduleId}:${schedule.scheduleType}:next=${schedule.nextExecution}`,
    });
    return this.reportAction(
      "create_schedule",
      started,
      input,
      config,
      schedule,
      [schedule],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  updateSchedule(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateScheduleAction(input, started);
    if (validation.decision === "fail") {
      return this.failReport("update_schedule", started, validation, config);
    }
    const schedule = this.registry.update(this.store, input.scheduleId!, input);
    if (!schedule) {
      return this.failReport(
        "update_schedule",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "Unknown scheduleId"] },
        config,
      );
    }
    this.ensureRecord("active", config);
    appendSchrtLog({
      event: "update_schedule",
      details: `${schedule.scheduleId}:${schedule.currentStatus}`,
    });
    return this.reportAction(
      "update_schedule",
      started,
      input,
      config,
      schedule,
      [schedule],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  pauseSchedule(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateScheduleAction(input, started);
    if (validation.decision === "fail") {
      return this.failReport("pause_schedule", started, validation, config);
    }
    const schedule = this.registry.pause(this.store, input.scheduleId!);
    if (!schedule) {
      return this.failReport(
        "pause_schedule",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "Unknown scheduleId"] },
        config,
      );
    }
    appendSchrtLog({ event: "pause_schedule", details: schedule.scheduleId });
    return this.reportAction(
      "pause_schedule",
      started,
      input,
      config,
      schedule,
      [schedule],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  resumeSchedule(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateScheduleAction(input, started);
    if (validation.decision === "fail") {
      return this.failReport("resume_schedule", started, validation, config);
    }
    const schedule = this.registry.resume(this.store, input.scheduleId!);
    if (!schedule) {
      return this.failReport(
        "resume_schedule",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "Unknown scheduleId"] },
        config,
      );
    }
    appendSchrtLog({ event: "resume_schedule", details: schedule.scheduleId });
    return this.reportAction(
      "resume_schedule",
      started,
      input,
      config,
      schedule,
      [schedule],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  cancelSchedule(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateScheduleAction(input, started);
    if (validation.decision === "fail") {
      return this.failReport("cancel_schedule", started, validation, config);
    }
    const schedule = this.registry.cancel(this.store, input.scheduleId!);
    if (!schedule) {
      return this.failReport(
        "cancel_schedule",
        started,
        { ...validation, decision: "fail", errors: [...validation.errors, "Unknown scheduleId"] },
        config,
      );
    }
    appendSchrtLog({ event: "cancel_schedule", details: schedule.scheduleId });
    return this.reportAction(
      "cancel_schedule",
      started,
      input,
      config,
      schedule,
      [schedule],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
    );
  }

  triggerEvent(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateEvent(input, started);
    if (validation.decision === "fail") {
      return this.failReport("trigger_event", started, validation, config);
    }

    const nowIso = input.now ?? new Date().toISOString();
    const eventKey = input.eventKey!;
    const matched = this.eventTrigger.matchSchedules(this.store, eventKey);
    const eventTriggers: EventTriggerRecord[] = [];
    const executions: ScheduleExecution[] = [];
    let lastSchedule: ScheduleDefinition | null = null;
    let lastExecution: ScheduleExecution | null = null;
    let lastTrigger: EventTriggerRecord | null = null;

    for (const schedule of matched) {
      const triggerRec = this.eventTrigger.recordMatch(this.store, schedule, eventKey, nowIso);
      eventTriggers.push(triggerRec);
      lastTrigger = triggerRec;
      const fired = this.fireSchedule(schedule, nowIso, config, `event:${eventKey}`);
      executions.push(fired.execution);
      lastExecution = fired.execution;
      lastSchedule = fired.schedule;
      this.store.updateSchedule(schedule.scheduleId, {
        currentStatus: "triggered",
        previousExecution: nowIso,
        nextExecution: null,
        fabricated: false,
        structuralSignalOnly: true,
      });
      lastSchedule = this.store.getSchedule(schedule.scheduleId);
      // Preserve history: append triggered status as additional record
      const updatedTrigger: EventTriggerRecord = {
        ...triggerRec,
        status: "triggered",
        supportingEvidence: [...triggerRec.supportingEvidence, "event_triggered_structurally"],
      };
      this.store.saveEventTrigger(updatedTrigger);
      lastTrigger = updatedTrigger;
    }

    this.ensureRecord("triggering", config);
    appendSchrtLog({
      event: "trigger_event",
      details: `${eventKey}:matched=${matched.length}`,
    });

    return this.reportAction(
      "trigger_event",
      started,
      input,
      config,
      lastSchedule,
      matched.map((s) => this.store.getSchedule(s.scheduleId)!).filter(Boolean),
      lastExecution,
      executions,
      null,
      [],
      lastTrigger,
      eventTriggers,
      null,
    );
  }

  evaluateDue(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("evaluate_due", started, validation, config);
    }

    const nowIso = input.now;
    if (!nowIso) {
      return this.failReport(
        "evaluate_due",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "evaluateDue requires input.now ISO timestamp"],
        },
        config,
      );
    }

    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) {
      return this.failReport(
        "evaluate_due",
        started,
        {
          ...validation,
          decision: "fail",
          errors: [...validation.errors, "input.now must be valid ISO"],
        },
        config,
      );
    }

    const maintenanceWindows = input.maintenanceWindows ?? [];
    const executions: ScheduleExecution[] = [];
    const updatedSchedules: ScheduleDefinition[] = [];
    let lastExecution: ScheduleExecution | null = null;
    let lastSchedule: ScheduleDefinition | null = null;

    for (const schedule of this.store.listSchedules()) {
      if (schedule.paused) continue;
      if (schedule.currentStatus === "cancelled" || schedule.currentStatus === "completed") continue;
      if (schedule.scheduleType === "event_driven") continue;
      if (!schedule.nextExecution) continue;

      const nextMs = Date.parse(schedule.nextExecution);
      if (Number.isNaN(nextMs) || nowMs < nextMs) continue;
      if (!this.windows.canFire(schedule, nowIso, maintenanceWindows)) continue;

      const fired = this.fireSchedule(schedule, nowIso, config, "time_due");
      executions.push(fired.execution);
      lastExecution = fired.execution;

      const previousExecution = schedule.nextExecution;
      let nextExecution: string | null = null;
      let currentStatus: ScheduleStatus = schedule.currentStatus;

      if (schedule.scheduleType === "one_time") {
        nextExecution = null;
        currentStatus = "completed";
      } else {
        nextExecution = this.recurrence.advanceAfterExecution(schedule, nowIso);
        currentStatus = "active";
      }

      const updated = this.store.updateSchedule(schedule.scheduleId, {
        previousExecution,
        nextExecution,
        currentStatus,
        fabricated: false,
        structuralSignalOnly: true,
      });
      if (updated) {
        updatedSchedules.push(updated);
        lastSchedule = updated;
      }
    }

    this.ensureRecord("evaluating", config);
    appendSchrtLog({
      event: "evaluate_due",
      details: `now=${nowIso}:fired=${executions.length}`,
    });

    return this.reportAction(
      "evaluate_due",
      started,
      input,
      config,
      lastSchedule,
      updatedSchedules.length ? updatedSchedules : this.store.listSchedules(),
      lastExecution,
      executions,
      null,
      [],
      null,
      [],
      null,
    );
  }

  detectConflicts(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("detect_conflicts", started, validation, config);
    }
    const nowIso = input.now ?? SCHRT_SEED_CLOCK_UTC;
    const conflicts = this.conflictDetector.detect(this.store, nowIso);
    this.ensureRecord("detecting_conflicts", config);
    appendSchrtLog({
      event: "detect_conflicts",
      details: `conflicts=${conflicts.length}`,
    });
    return this.reportAction(
      "detect_conflicts",
      started,
      input,
      config,
      null,
      this.store.listSchedules(),
      null,
      [],
      conflicts[0] ?? null,
      conflicts,
      null,
      [],
      null,
    );
  }

  produceReport(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("produce_report", started, validation, config);
    }

    const outstanding: string[] = [];
    if (this.store.listConflicts().length > 0) {
      outstanding.push("scheduling conflicts present");
    }
    const report = this.reportBuilder.buildSchedulingRuntimeReport(
      this.store,
      this.metricsCollector,
      config,
      {
        auditStatus: "pending",
        outstandingIssues: outstanding,
        confidenceScore: outstanding.length ? 0.82 : 0.94,
        supportingEvidence: [
          `schedules=${this.store.listSchedules().length}`,
          `executions=${this.store.listExecutions().length}`,
        ],
      },
    );
    this.store.saveReport(report);
    if (this.engineRecord) {
      this.engineRecord = {
        ...this.engineRecord,
        totalReports: this.store.listReports().length,
        lastReportId: report.reportId,
        operationalState: "reporting",
      };
    }
    appendSchrtLog({
      event: "produce_report",
      details: `${report.reportId}:consumableByQ1013=${report.consumableByQ1013}`,
    });
    return this.reportAction(
      "produce_report",
      started,
      input,
      config,
      null,
      this.store.listSchedules(),
      null,
      this.store.listExecutions(),
      null,
      this.store.listConflicts(),
      null,
      this.store.listEventTriggers(),
      report,
    );
  }

  submitReport(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const produced = this.produceReport(input, config);
    if (produced.decision === "fail" || !produced.schedulingRuntimeReport) return produced;
    this.integrations.submitReport(produced.schedulingRuntimeReport);
    this.integrations.recordAudit({
      auditReference: `audit://schrt/report/${produced.schedulingRuntimeReport.reportId}`,
      reportId: produced.schedulingRuntimeReport.reportId,
      structuralSignalOnly: true,
    });
    appendSchrtLog({
      event: "submit_report",
      details: produced.schedulingRuntimeReport.reportId,
    });
    return {
      ...produced,
      action: "submit_report",
    };
  }

  list(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    if (validation.decision === "fail") {
      return this.failReport("list", started, validation, config);
    }
    return this.reportAction(
      "list",
      started,
      input,
      config,
      null,
      this.store.listSchedules(),
      null,
      this.store.listExecutions(),
      null,
      this.store.listConflicts(),
      null,
      this.store.listEventTriggers(),
      null,
    );
  }

  validate(input: SchrtInput, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.validateInput(input, started);
    return this.reportAction(
      "validate",
      started,
      input,
      config,
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      null,
      [],
      validation,
    );
  }

  diagnostics(_input: Record<string, unknown>, config: SchedulingRuntimeConfiguration): SchrtRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    const diag = this.reportBuilder.buildDiagnostics(this.store, handshakes);
    appendSchrtLog({
      event: "diagnostics",
      details: diag.diagnosticsId,
    });
    return this.reportAction(
      "diagnostics",
      started,
      { validated: true },
      config,
      null,
      this.store.listSchedules(),
      null,
      this.store.listExecutions(),
      null,
      this.store.listConflicts(),
      null,
      this.store.listEventTriggers(),
      null,
      handshakes,
    );
  }

  private fireSchedule(
    schedule: ScheduleDefinition,
    nowIso: string,
    _config: SchedulingRuntimeConfiguration,
    reason: string,
  ): { schedule: ScheduleDefinition; execution: ScheduleExecution } {
    const mission = this.missionTrigger.trigger(
      this.integrations.getMissionRuntime(),
      schedule,
      nowIso,
    );
    const queue = this.queueCoordinator.enqueueSignal(
      this.integrations.getQueueRuntime(),
      schedule,
      nowIso,
    );

    const execution: ScheduleExecution = {
      executionId: nextSchrtId("schrt-exec"),
      scheduleId: schedule.scheduleId,
      missionId: schedule.missionId,
      workerId: schedule.workerId,
      factoryId: schedule.factoryId,
      scheduledFor: schedule.nextExecution ?? nowIso,
      executedAt: nowIso,
      status: "completed",
      triggerRef: mission.triggerRef,
      queueRef: queue.queueRef,
      supportingEvidence: [
        `reason:${reason}`,
        `mission_called=${mission.called}`,
        `queue_called=${queue.called}`,
        ...mission.notes,
        ...queue.notes,
        "never_fabricated",
        "structural_signal_only",
      ],
      auditReference: schedule.auditReference,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: SCHRT_METADATA_VERSION,
    };
    this.store.saveExecution(execution);
    return { schedule, execution };
  }

  private ensureRecord(state: SchrtEngineRecord["operationalState"], config: SchedulingRuntimeConfiguration) {
    const metrics = this.metricsCollector.collect(this.store);
    this.engineRecord = {
      engineId: SCHEDULING_RUNTIME_ID,
      workerId: config.workerId,
      operationalState: state,
      healthStatus: "healthy",
      totalSchedules: metrics.totalSchedules,
      totalExecutions: metrics.totalExecutions,
      totalConflicts: metrics.totalConflicts,
      totalEventTriggers: metrics.totalEventTriggers,
      totalReports: metrics.totalReports,
      lastReportId: this.engineRecord?.lastReportId ?? null,
      supportedCapabilities: [...SCHRT_CAPABILITIES],
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SCHRT_METADATA_VERSION,
    };
  }

  private failReport(
    action: string,
    started: number,
    validation: SchrtValidationReport,
    config: SchedulingRuntimeConfiguration,
  ): SchrtRunReport {
    this.ensureRecord("failed", config);
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision: "fail",
      validation,
      schedule: null,
      schedules: [],
      execution: null,
      executions: [],
      conflict: null,
      conflicts: [],
      eventTrigger: null,
      eventTriggers: [],
      schedulingRuntimeReport: null,
      q1013Contract: action === "get_q1013_contract" ? this.getQ1013ConsumableContract(config) : null,
      integrationHandshakes: [],
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }

  private reportAction(
    action: string,
    started: number,
    input: SchrtInput,
    config: SchedulingRuntimeConfiguration,
    schedule: ScheduleDefinition | null,
    schedules: ScheduleDefinition[],
    execution: ScheduleExecution | null,
    executions: ScheduleExecution[],
    conflict: ConflictRecord | null,
    conflicts: ConflictRecord[],
    eventTrigger: EventTriggerRecord | null,
    eventTriggers: EventTriggerRecord[],
    schedulingRuntimeReport: SchrtRunReport["schedulingRuntimeReport"],
    handshakes: IntegrationHandshake[] = [],
    validationOverride?: SchrtValidationReport,
  ): SchrtRunReport {
    const validation =
      validationOverride ?? this.validator.validateInput({ ...input, validated: true }, started);
    const decision =
      validation.decision === "fail"
        ? "fail"
        : validation.errors.length
          ? "fail"
          : validation.warnings.length
            ? "partial"
            : "pass";
    return {
      action,
      runTimestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      decision,
      validation,
      schedule,
      schedules,
      execution,
      executions,
      conflict,
      conflicts,
      eventTrigger,
      eventTriggers,
      schedulingRuntimeReport,
      q1013Contract: null,
      integrationHandshakes: handshakes,
      errors: [...validation.errors],
      warnings: [...validation.warnings],
    };
  }
}
