import type { ApprovalRuntimeConfiguration } from "./configuration.js";
import type { ApprovalRuntimeDependencies } from "./integrations.js";
import { ApprovalRuntimeManager } from "./approval-runtime-manager.js";
import type {
  EngineStatus,
  Q1010ConsumableContract,
  ApprovalRuntimeCockpitSnapshot,
  ApvrtInput,
  ApvrtRunReport,
} from "./types.js";

export class ApprovalRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: ApvrtRunReport | null = null;

  constructor(
    private readonly manager: ApprovalRuntimeManager,
    private readonly config: ApprovalRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ApprovalRuntimeDependencies = {}) {
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

  registerPolicy(input: ApvrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerPolicy(input, this.config));
  }

  determineRequirements(input: ApvrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.determineRequirements(input, this.config));
  }

  submitApprovalRequest(input: ApvrtInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.submitApprovalRequest(input, this.config));
  }

  routeApproval(input: ApvrtInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.routeApproval(input, this.config));
  }

  decide(input: ApvrtInput = {}) {
    this.status = "deciding";
    return this.finish(this.manager.decide(input, this.config));
  }

  resumeExecution(input: ApvrtInput = {}) {
    this.status = "resuming";
    return this.finish(this.manager.resumeExecution(input, this.config));
  }

  produceReport(input: ApvrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: ApvrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: ApvrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: ApvrtInput = {}) {
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

  getQ1010ConsumableContract(): Q1010ConsumableContract {
    return this.manager.getQ1010ConsumableContract(this.config);
  }

  getCockpitSnapshot(): ApprovalRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-09",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalPolicies: record?.totalPolicies ?? 0,
      totalRequests: record?.totalRequests ?? 0,
      totalDecisions: record?.totalDecisions ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverFabricateApprovalDecisions: true,
      neverAutoApproveRestrictedActions: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1010OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: ApvrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "routing" ||
      this.status === "deciding" ||
      this.status === "resuming" ||
      this.status === "reporting"
    ) {
      this.status = "active";
    }
    return report;
  }
}
