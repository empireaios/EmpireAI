import type { MemoryRuntimeConfiguration } from "./configuration.js";
import type { MemoryRuntimeDependencies } from "./integrations.js";
import { MemoryRuntimeManager } from "./memory-runtime-manager.js";
import type {
  EngineStatus,
  MemrtInput,
  MemrtRunReport,
  MemoryRuntimeCockpitSnapshot,
  Q1006ConsumableContract,
} from "./types.js";

export class MemoryRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: MemrtRunReport | null = null;

  constructor(
    private readonly manager: MemoryRuntimeManager,
    private readonly config: MemoryRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MemoryRuntimeDependencies = {}) {
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

  storeMemory(input: MemrtInput = {}) {
    this.status = "storing";
    return this.finish(this.manager.storeMemory(input, this.config));
  }

  retrieveMemory(input: MemrtInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.retrieveMemory(input, this.config));
  }

  storeDecision(input: MemrtInput = {}) {
    this.status = "storing";
    return this.finish(this.manager.storeDecision(input, this.config));
  }

  retrieveDecisionHistory(input: MemrtInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.retrieveDecisionHistory(input, this.config));
  }

  retrievePreviousResults(input: MemrtInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.retrievePreviousResults(input, this.config));
  }

  provideRuntimeContext(input: MemrtInput = {}) {
    this.status = "indexing";
    return this.finish(this.manager.provideRuntimeContext(input, this.config));
  }

  listVersions(input: MemrtInput = {}) {
    this.status = "retrieving";
    return this.finish(this.manager.listVersions(input, this.config));
  }

  produceReport(input: MemrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: MemrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: MemrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: MemrtInput = {}) {
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

  getQ1006ConsumableContract(): Q1006ConsumableContract {
    return this.manager.getQ1006ConsumableContract(this.config);
  }

  getCockpitSnapshot(): MemoryRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const metrics = this.manager.getHistory();
    return {
      missionId: "Q10-05",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalEntries: record?.totalEntries ?? 0,
      totalVersions: record?.totalVersions ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverReplaceEkls: true,
      neverReplaceApplicationDatabases: true,
      neverModifyHistoricalRecords: true,
      neverFabricateMemory: true,
      neverSilentlyOverwriteHistoricalDecisions: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1006OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: MemrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "active";
    return report;
  }
}
