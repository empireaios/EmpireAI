import type { MonitoringRuntimeConfiguration } from "./configuration.js";
import type { MonitoringRuntimeDependencies } from "./integrations.js";
import { MonitoringRuntimeManager } from "./monitoring-runtime-manager.js";
import type {
  EngineStatus,
  Q1011ConsumableContract,
  MonitoringRuntimeCockpitSnapshot,
  MonrtInput,
  MonrtRunReport,
} from "./types.js";

export class MonitoringRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: MonrtRunReport | null = null;

  constructor(
    private readonly manager: MonitoringRuntimeManager,
    private readonly config: MonitoringRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MonitoringRuntimeDependencies = {}) {
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

  registerComponent(input: MonrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerComponent(input, this.config));
  }

  recordHeartbeat(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.recordHeartbeat(input, this.config));
  }

  monitorWorkers(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorWorkers(input, this.config));
  }

  monitorFactories(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorFactories(input, this.config));
  }

  monitorRuntimes(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorRuntimes(input, this.config));
  }

  monitorApis(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorApis(input, this.config));
  }

  monitorQueues(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorQueues(input, this.config));
  }

  monitorMissions(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorMissions(input, this.config));
  }

  monitorTools(input: MonrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitorTools(input, this.config));
  }

  detectAnomalies(input: MonrtInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectAnomalies(input, this.config));
  }

  generateAlerts(input: MonrtInput = {}) {
    this.status = "alerting";
    return this.finish(this.manager.generateAlerts(input, this.config));
  }

  produceReport(input: MonrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: MonrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: MonrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: MonrtInput = {}) {
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

  getQ1011ConsumableContract(): Q1011ConsumableContract {
    return this.manager.getQ1011ConsumableContract(this.config);
  }

  getDashboard() {
    return this.manager.getDashboard(this.config);
  }

  getCockpitSnapshot(): MonitoringRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const criticalAlertCount = this.manager.getHistory().alerts.filter(
      (a) => a.severity === "critical",
    ).length;
    return {
      missionId: "Q10-10",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalComponents: record?.totalComponents ?? 0,
      totalHeartbeats: record?.totalHeartbeats ?? 0,
      totalAlerts: record?.totalAlerts ?? 0,
      criticalAlertCount,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateHealthInformation: true,
      neverSuppressCriticalAlerts: true,
      neverAutomaticallyRepairFailures: true,
      neverReplaceRecoverySystems: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1011OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: MonrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "monitoring" ||
      this.status === "detecting" ||
      this.status === "alerting" ||
      this.status === "reporting"
    ) {
      this.status = "active";
    }
    return report;
  }
}
