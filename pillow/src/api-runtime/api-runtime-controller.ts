import type { ApiRuntimeConfiguration } from "./configuration.js";
import type { ApiRuntimeDependencies } from "./integrations.js";
import { ApiRuntimeManager } from "./api-runtime-manager.js";
import type {
  ApiRuntimeCockpitSnapshot,
  ApirtInput,
  ApirtRunReport,
  EngineStatus,
  Q1007ConsumableContract,
} from "./types.js";

export class ApiRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: ApirtRunReport | null = null;

  constructor(
    private readonly manager: ApiRuntimeManager,
    private readonly config: ApiRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ApiRuntimeDependencies = {}) {
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

  registerProvider(input: ApirtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerProvider(input, this.config));
  }

  manageConnection(input: ApirtInput = {}) {
    this.status = "connecting";
    return this.finish(this.manager.manageConnection(input, this.config));
  }

  authenticate(input: ApirtInput = {}) {
    this.status = "authenticating";
    return this.finish(this.manager.authenticate(input, this.config));
  }

  routeRequest(input: ApirtInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.routeRequest(input, this.config));
  }

  checkHealth(input: ApirtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.checkHealth(input, this.config));
  }

  produceReport(input: ApirtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: ApirtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: ApirtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: ApirtInput = {}) {
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

  getQ1007ConsumableContract(): Q1007ConsumableContract {
    return this.manager.getQ1007ConsumableContract(this.config);
  }

  getCockpitSnapshot(): ApiRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-06",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalProviders: record?.totalProviders ?? 0,
      totalConnections: record?.totalConnections ?? 0,
      totalTraces: record?.totalTraces ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverExposeSecrets: true,
      neverFabricateApiResponses: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1007OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: ApirtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting" || this.status === "routing" || this.status === "authenticating") {
      this.status = "active";
    }
    return report;
  }
}
