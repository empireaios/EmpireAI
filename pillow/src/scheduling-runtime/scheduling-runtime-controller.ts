import type { SchedulingRuntimeConfiguration } from "./configuration.js";
import type { SchedulingRuntimeDependencies } from "./integrations.js";
import { SchedulingRuntimeManager } from "./scheduling-runtime-manager.js";
import type {
  EngineStatus,
  Q1013ConsumableContract,
  SchedulingRuntimeCockpitSnapshot,
  SchrtInput,
  SchrtRunReport,
} from "./types.js";

export class SchedulingRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: SchrtRunReport | null = null;

  constructor(
    private readonly manager: SchedulingRuntimeManager,
    private readonly config: SchedulingRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SchedulingRuntimeDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  createSchedule(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.createSchedule(input, this.config));
  }

  updateSchedule(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.updateSchedule(input, this.config));
  }

  pauseSchedule(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.pauseSchedule(input, this.config));
  }

  resumeSchedule(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.resumeSchedule(input, this.config));
  }

  cancelSchedule(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.cancelSchedule(input, this.config));
  }

  triggerEvent(input: SchrtInput = {}) {
    this.status = "triggering";
    return this.finish(this.manager.triggerEvent(input, this.config));
  }

  evaluateDue(input: SchrtInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateDue(input, this.config));
  }

  detectConflicts(input: SchrtInput = {}) {
    this.status = "detecting_conflicts";
    return this.finish(this.manager.detectConflicts(input, this.config));
  }

  produceReport(input: SchrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: SchrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: SchrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    this.status = "active";
    return this.finish(this.manager.diagnostics({}, this.config));
  }

  getHistory() {
    return this.manager.getHistory();
  }

  getQ1013ConsumableContract(): Q1013ConsumableContract {
    return this.manager.getQ1013ConsumableContract(this.config);
  }

  getCockpitSnapshot(): SchedulingRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const history = this.manager.getHistory();
    const activeSchedules = history.schedules.filter(
      (s) => !s.paused && (s.currentStatus === "active" || s.currentStatus === "draft"),
    ).length;
    const completedExecutions = history.executions.filter((e) => e.status === "completed").length;
    return {
      missionId: "Q10-12",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalSchedules: record?.totalSchedules ?? history.schedules.length,
      totalExecutions: record?.totalExecutions ?? history.executions.length,
      activeSchedules,
      completedExecutions,
      conflictCount: history.conflicts.length,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateExecutionTimes: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverReplaceQueueRuntime: true,
      neverReplaceMissionRuntime: true,
      neverExecuteUnauthorizedWork: true,
      neverImplementQ1013OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: SchrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "evaluating" ||
      this.status === "triggering" ||
      this.status === "detecting_conflicts" ||
      this.status === "reporting"
    ) {
      this.status = "active";
    }
    return report;
  }
}
