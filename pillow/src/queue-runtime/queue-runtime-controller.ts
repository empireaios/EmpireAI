import type { QueueRuntimeConfiguration } from "./configuration.js";
import type { QueueRuntimeDependencies } from "./integrations.js";
import { QueueRuntimeManager } from "./queue-runtime-manager.js";
import type {
  EngineStatus,
  Q1005ConsumableContract,
  QrtInput,
  QrtRunReport,
  QueueRuntimeCockpitSnapshot,
} from "./types.js";

export class QueueRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: QrtRunReport | null = null;

  constructor(
    private readonly manager: QueueRuntimeManager,
    private readonly config: QueueRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: QueueRuntimeDependencies = {}) {
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

  createQueue(input: QrtInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createQueue(input, this.config));
  }

  enqueue(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.enqueue(input, this.config));
  }

  prioritize(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.prioritize(input, this.config));
  }

  pauseQueue(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.pauseQueue(input, this.config));
  }

  resumeQueue(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.resumeQueue(input, this.config));
  }

  cancelJob(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.cancelJob(input, this.config));
  }

  dispatchReady(input: QrtInput = {}) {
    this.status = "dispatching";
    return this.finish(this.manager.dispatchReady(input, this.config));
  }

  retryFailed(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.retryFailed(input, this.config));
  }

  moveToDeadLetter(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.moveToDeadLetter(input, this.config));
  }

  metrics(input: QrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.metrics(input, this.config));
  }

  produceReport(input: QrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: QrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    this.status = "active";
    return this.finish(this.manager.diagnostics({}, this.config));
  }

  completeJob(input: QrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.completeJob(input, this.config));
  }

  getHistory() {
    return this.manager.getHistory();
  }

  getQ1005ConsumableContract(): Q1005ConsumableContract {
    return this.manager.getQ1005ConsumableContract(this.config);
  }

  getCockpitSnapshot(): QueueRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const metrics = this.manager.getHistory();
    return {
      missionId: "Q10-04",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalQueues: record?.totalQueues ?? 0,
      totalJobs: record?.totalJobs ?? metrics.jobs.length,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverReplaceWorkerLogic: true,
      neverReplaceMissionLogic: true,
      neverExecuteBusinessSpecificWork: true,
      neverFabricateQueueState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1005OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: QrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "active";
    return report;
  }
}
