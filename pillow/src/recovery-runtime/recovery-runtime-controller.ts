import type { RecoveryRuntimeConfiguration } from "./configuration.js";
import type { RecoveryRuntimeDependencies } from "./integrations.js";
import { RecoveryRuntimeManager } from "./recovery-runtime-manager.js";
import type {
  EngineStatus,
  Q1012ConsumableContract,
  RecoveryRuntimeCockpitSnapshot,
  RecrtInput,
  RecrtRunReport,
} from "./types.js";

export class RecoveryRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: RecrtRunReport | null = null;

  constructor(
    private readonly manager: RecoveryRuntimeManager,
    private readonly config: RecoveryRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: RecoveryRuntimeDependencies = {}) {
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

  detectFailure(input: RecrtInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.detectFailure(input, this.config));
  }

  classifyFailure(input: RecrtInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.classifyFailure(input, this.config));
  }

  selectStrategy(input: RecrtInput = {}) {
    this.status = "classifying";
    return this.finish(this.manager.selectStrategy(input, this.config));
  }

  restoreState(input: RecrtInput = {}) {
    this.status = "restoring";
    return this.finish(this.manager.restoreState(input, this.config));
  }

  restartJob(input: RecrtInput = {}) {
    this.status = "restarting";
    return this.finish(this.manager.restartJob(input, this.config));
  }

  resumeWorkflow(input: RecrtInput = {}) {
    this.status = "restoring";
    return this.finish(this.manager.resumeWorkflow(input, this.config));
  }

  rollback(input: RecrtInput = {}) {
    this.status = "rolling_back";
    return this.finish(this.manager.rollback(input, this.config));
  }

  escalate(input: RecrtInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalate(input, this.config));
  }

  runRecovery(input: RecrtInput = {}) {
    this.status = "detecting";
    return this.finish(this.manager.runRecovery(input, this.config));
  }

  produceReport(input: RecrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: RecrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: RecrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: RecrtInput = {}) {
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

  getQ1012ConsumableContract(): Q1012ConsumableContract {
    return this.manager.getQ1012ConsumableContract(this.config);
  }

  getCockpitSnapshot(): RecoveryRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    const history = this.manager.getHistory();
    const activeRecoveries = history.cases.filter((c) =>
      [
        "detected",
        "classified",
        "restoring",
        "restarting",
        "rolling_back",
        "resumed",
        "awaiting_approval",
      ].includes(c.recoveryStatus),
    ).length;
    const completedRecoveries = history.cases.filter(
      (c) => c.recoveryStatus === "completed",
    ).length;
    const failedRecoveries = history.cases.filter(
      (c) => c.recoveryStatus === "failed" || c.recoveryStatus === "escalated",
    ).length;
    return {
      missionId: "Q10-11",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalFailures: record?.totalFailures ?? 0,
      totalRecoveries: record?.totalRecoveries ?? 0,
      activeRecoveries,
      completedRecoveries,
      failedRecoveries,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateRecoverySuccess: true,
      neverLoseRecoverableExecutionState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverModifyValidatedBusinessData: true,
      neverReplaceBusinessLogic: true,
      neverImplementQ1012OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: RecrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "detecting" ||
      this.status === "classifying" ||
      this.status === "restoring" ||
      this.status === "restarting" ||
      this.status === "rolling_back" ||
      this.status === "escalating" ||
      this.status === "reporting"
    ) {
      this.status = "active";
    }
    return report;
  }
}
