import type { WorkerMonitoringConfiguration } from "./configuration.js";
import { WorkerMonitoringCore } from "./worker-monitoring-core.js";
import type {
  EngineStatus,
  WorkerMonitoringInput,
  WorkerMonitoringRunReport,
} from "./types.js";

export class WorkerMonitoringController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerMonitoringRunReport | null = null;

  constructor(
    private readonly manager: WorkerMonitoringCore,
    private readonly config: WorkerMonitoringConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
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
      healthStates: [...this.config.healthStates],
      monitoringEvents: [...this.config.monitoringEvents],
      monitoringRules: [...this.config.monitoringRules],
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        neverExecuteWorkerTasks: true as const,
      })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        alerts: r.alerts.map((a) => ({ ...a, reportedToPillow: true as const })),
        events: [...r.events],
        neverExecuteWorkerTasks: true as const,
        neverRestartWorkersAutomatically: true as const,
        neverReplaceWorkforceCertificationMonitor: true as const,
        neverOverridePillow: true as const,
        neverOverrideGrandKing: true as const,
        preserveMonitoringHistory: true as const,
        supportsExecutiveReportingRuntime: true as const,
        structuralSignalOnly: true as const,
        maskSensitiveValues: true as const,
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerWorker(input: WorkerMonitoringInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  observe(input: WorkerMonitoringInput = {}) {
    this.status = "observing";
    return this.finish(this.manager.observe(input, this.config));
  }

  scanActive(input: WorkerMonitoringInput = {}) {
    this.status = "observing";
    return this.finish(this.manager.scanActive(input, this.config));
  }

  detectAnomalies(input: WorkerMonitoringInput = {}) {
    this.status = "observing";
    return this.finish(this.manager.detectAnomalies(input, this.config));
  }

  generateAlerts(input: WorkerMonitoringInput = {}) {
    this.status = "alerting";
    return this.finish(this.manager.generateAlerts(input, this.config));
  }

  recordEvent(input: WorkerMonitoringInput = {}) {
    this.status = "observing";
    return this.finish(this.manager.recordEvent(input, this.config));
  }

  produce(input: WorkerMonitoringInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerMonitoringInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerMonitoringRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
