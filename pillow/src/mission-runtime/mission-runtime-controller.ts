import type { MissionRuntimeConfiguration } from "./configuration.js";
import type { MissionRuntimeDependencies } from "./integrations.js";
import { MissionManager } from "./mission-manager.js";
import type {
  EngineStatus,
  MissionRuntimeCockpitSnapshot,
  MsrInput,
  MsrRunReport,
  Q1004ConsumableContract,
} from "./types.js";

export class MissionRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: MsrRunReport | null = null;

  constructor(
    private readonly manager: MissionManager,
    private readonly config: MissionRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MissionRuntimeDependencies = {}) {
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

  createMission(input: MsrInput = {}) {
    this.status = "creating";
    return this.finish(this.manager.createMission(input, this.config));
  }

  queue(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.queue(input, this.config));
  }

  ready(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.ready(input, this.config));
  }

  execute(input: MsrInput = {}) {
    this.status = "executing";
    return this.finish(this.manager.execute(input, this.config));
  }

  pause(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.pause(input, this.config));
  }

  resume(input: MsrInput = {}) {
    this.status = "executing";
    return this.finish(this.manager.resume(input, this.config));
  }

  retry(input: MsrInput = {}) {
    this.status = "executing";
    return this.finish(this.manager.retry(input, this.config));
  }

  cancel(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.cancel(input, this.config));
  }

  recover(input: MsrInput = {}) {
    this.status = "executing";
    return this.finish(this.manager.recover(input, this.config));
  }

  archive(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.archive(input, this.config));
  }

  monitor(input: MsrInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.monitor(input, this.config));
  }

  produceReport(input: MsrInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: MsrInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: MsrInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: MsrInput = {}) {
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

  getQ1004ConsumableContract(): Q1004ConsumableContract {
    return this.manager.getQ1004ConsumableContract(this.config);
  }

  getCockpitSnapshot(): MissionRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-03",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalMissions: record?.totalMissions ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverReplaceWorkerLogic: true,
      neverReplaceOrchestrationLogic: true,
      neverExecuteUnauthorisedMissions: true,
      neverFabricateMissionState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1004OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: MsrRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "active";
    return report;
  }
}
