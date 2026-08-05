import type { ToolRuntimeConfiguration } from "./configuration.js";
import type { ToolRuntimeDependencies } from "./integrations.js";
import { ToolRuntimeManager } from "./tool-runtime-manager.js";
import type {
  EngineStatus,
  Q1008ConsumableContract,
  ToolRuntimeCockpitSnapshot,
  ToolrtInput,
  ToolrtRunReport,
} from "./types.js";

export class ToolRuntimeController {
  private status: EngineStatus = "idle";
  private latestReport: ToolrtRunReport | null = null;

  constructor(
    private readonly manager: ToolRuntimeManager,
    private readonly config: ToolRuntimeConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ToolRuntimeDependencies = {}) {
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

  registerTool(input: ToolrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.registerTool(input, this.config));
  }

  discoverTools(input: ToolrtInput = {}) {
    this.status = "discovering";
    return this.finish(this.manager.discoverTools(input, this.config));
  }

  authenticate(input: ToolrtInput = {}) {
    this.status = "authenticating";
    return this.finish(this.manager.authenticate(input, this.config));
  }

  invokeTool(input: ToolrtInput = {}) {
    this.status = "invoking";
    return this.finish(this.manager.invokeTool(input, this.config));
  }

  checkAvailability(input: ToolrtInput = {}) {
    this.status = "monitoring";
    return this.finish(this.manager.checkAvailability(input, this.config));
  }

  produceReport(input: ToolrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitReport(input: ToolrtInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: ToolrtInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: ToolrtInput = {}) {
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

  getQ1008ConsumableContract(): Q1008ConsumableContract {
    return this.manager.getQ1008ConsumableContract(this.config);
  }

  getCockpitSnapshot(): ToolRuntimeCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-07",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalTools: record?.totalTools ?? 0,
      totalConnections: record?.totalConnections ?? 0,
      totalInvocations: record?.totalInvocations ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverExposeSecrets: true,
      neverFabricateExecutionResults: true,
      neverInvokeUnauthorizedTools: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1008OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: ToolrtRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (
      this.status === "connecting" ||
      this.status === "invoking" ||
      this.status === "authenticating" ||
      this.status === "discovering"
    ) {
      this.status = "active";
    }
    return report;
  }
}
