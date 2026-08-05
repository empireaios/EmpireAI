import type { AuditRuntimeConfiguration } from "./configuration.js";
import type { AuditRuntimeDependencies } from "./integrations.js";
import { AuditRuntimeManager } from "./audit-runtime-manager.js";
import type {
  EngineStatus,
  Q1014ConsumableContract,
  AuditRuntimeCockpitSnapshot,
  AudrtInput,
  AudrtRunReport,
} from "./types.js";

export class AuditRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: AudrtRunReport | null = null;

  constructor(
    private readonly manager: AuditRuntimeManager,
    private readonly config: AuditRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: AuditRuntimeDependencies = {}) {
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

  recordEvent(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordEvent(input, this.config));
  }

  recordWorkerAction(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordWorkerAction(input, this.config));
  }

  recordMissionLifecycle(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordMissionLifecycle(input, this.config));
  }

  recordApproval(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordApproval(input, this.config));
  }

  recordRecovery(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordRecovery(input, this.config));
  }

  recordScheduling(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.recordScheduling(input, this.config));
  }

  attachEvidence(input: AudrtInput = {}) {
    this.status = "recording";
    return this.finish(this.manager.attachEvidence(input, this.config));
  }

  query(input: AudrtInput = {}) {
    this.status = "querying";
    return this.finish(this.manager.query(input, this.config));
  }

  verifyIntegrity(input: AudrtInput = {}) {
    this.status = "verifying";
    return this.finish(this.manager.verifyIntegrity(input, this.config));
  }

  exportRecords(input: AudrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.exportRecords(input, this.config));
  }

  produceReport(input: AudrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: AudrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: AudrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: AudrtInput = {}) {
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

  getQ1014ConsumableContract(): Q1014ConsumableContract {
    return this.manager.getQ1014ConsumableContract(this.config);
  }

  recordAuditEvent(payload: unknown) {
    return this.manager.recordAuditEvent(payload);
  }

  getCockpitSnapshot(): AuditRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const history = this.manager.getHistory();
    const verifiedCount = history.records.filter((r) => r.auditIntegrityStatus === "verified").length;
    return {
      missionId: "Q10-13",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalAuditRecords: record?.totalAuditRecords ?? history.records.length,
      verifiedCount,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateAuditEvidence: true,
      neverDeleteAuditRecords: true,
      neverExecuteBusinessLogic: true,
      neverModifyOperationalData: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1014OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: AudrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "recording" ||
      this.status === "querying" ||
      this.status === "verifying" ||
      this.status === "reporting"
    ) {
      this.status = "active";
    }
    return report;
  }
}
