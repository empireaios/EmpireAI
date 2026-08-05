import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import type { PillowOrchestrationRuntimeDependencies } from "./integrations.js";
import { OrchestrationManager } from "./orchestration-manager.js";
import type {
  EngineStatus,
  PillowOrchestrationRuntimeCockpitSnapshot,
  PorInput,
  PorRunReport,
  Q1003ConsumableContract,
} from "./types.js";

export class PillowOrchestrationRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: PorRunReport | null = null;

  constructor(
    private readonly manager: OrchestrationManager,
    private readonly config: PillowOrchestrationRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: PillowOrchestrationRuntimeDependencies = {}) {
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
      orchestrationServices: [...this.config.orchestrationServices],
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

  createSession(input: PorInput = {}) {
    this.status = "active";
    return this.finish(this.manager.createSession(input, this.config));
  }

  invokeWorker(input: PorInput = {}) {
    this.status = "invoking";
    return this.finish(this.manager.invokeWorker(input, this.config));
  }

  invokeTool(input: PorInput = {}) {
    this.status = "invoking";
    return this.finish(this.manager.invokeTool(input, this.config));
  }

  invokeWorkflow(input: PorInput = {}) {
    this.status = "orchestrating";
    return this.finish(this.manager.invokeWorkflow(input, this.config));
  }

  routeApproval(input: PorInput = {}) {
    this.status = "dispatching";
    return this.finish(this.manager.routeApproval(input, this.config));
  }

  retrieveReport(input: PorInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.retrieveReport(input, this.config));
  }

  orchestrateCrossFactory(input: PorInput = {}) {
    this.status = "orchestrating";
    return this.finish(this.manager.orchestrateCrossFactory(input, this.config));
  }

  produceOrchestrationReport(input: PorInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceOrchestrationReport(input, this.config));
  }

  submitReport(input: PorInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: PorInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: PorInput = {}) {
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

  getQ1003ConsumableContract(): Q1003ConsumableContract {
    return this.manager.getQ1003ConsumableContract(this.config);
  }

  getCockpitSnapshot(): PillowOrchestrationRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-02",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalSessions: record?.totalSessions ?? 0,
      totalInvocations: record?.totalInvocations ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverReplaceWorkerImplementations: true,
      neverReplaceToolImplementations: true,
      neverExecuteUnauthorisedActions: true,
      neverFabricateExecutionResults: true,
      neverBypassApprovalRuntime: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1003OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: PorRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "active";
    return report;
  }
}
