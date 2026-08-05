import type { CommunicationRuntimeConfiguration } from "./configuration.js";
import type { CommunicationRuntimeDependencies } from "./integrations.js";
import { CommunicationRuntimeManager } from "./communication-runtime-manager.js";
import type {
  EngineStatus,
  Q1009ConsumableContract,
  CommunicationRuntimeCockpitSnapshot,
  ComrtInput,
  ComrtRunReport,
} from "./types.js";

export class CommunicationRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: ComrtRunReport | null = null;

  constructor(
    private readonly manager: CommunicationRuntimeManager,
    private readonly config: CommunicationRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: CommunicationRuntimeDependencies = {}) {
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

  openChannel(input: ComrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.openChannel(input, this.config));
  }

  sendMessage(input: ComrtInput = {}) {
    this.status = "delivering";
    return this.finish(this.manager.sendMessage(input, this.config));
  }

  acknowledgeMessage(input: ComrtInput = {}) {
    this.status = "acknowledging";
    return this.finish(this.manager.acknowledgeMessage(input, this.config));
  }

  openCollaborationSession(input: ComrtInput = {}) {
    this.status = "collaborating";
    return this.finish(this.manager.openCollaborationSession(input, this.config));
  }

  closeCollaborationSession(input: ComrtInput = {}) {
    this.status = "collaborating";
    return this.finish(this.manager.closeCollaborationSession(input, this.config));
  }

  retryFailed(input: ComrtInput = {}) {
    this.status = "retrying";
    return this.finish(this.manager.retryFailed(input, this.config));
  }

  produceReport(input: ComrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: ComrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: ComrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: ComrtInput = {}) {
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

  getQ1009ConsumableContract(): Q1009ConsumableContract {
    return this.manager.getQ1009ConsumableContract(this.config);
  }

  getCockpitSnapshot(): CommunicationRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-08",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalChannels: record?.totalChannels ?? 0,
      totalMessages: record?.totalMessages ?? 0,
      totalSessions: record?.totalSessions ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateMessages: true,
      neverLoseAcknowledgedMessages: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1009OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: ComrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "delivering" ||
      this.status === "acknowledging" ||
      this.status === "retrying" ||
      this.status === "collaborating"
    ) {
      this.status = "active";
    }
    return report;
  }
}
