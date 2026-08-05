import type { SharedRuntimeCoreConfiguration } from "./configuration.js";
import type { SharedRuntimeCoreDependencies } from "./integrations.js";
import { RuntimeManager } from "./runtime-manager.js";
import type {
  EngineStatus,
  Q1002ConsumableContract,
  SharedRuntimeCoreCockpitSnapshot,
  SrtcInput,
  SrtcRunReport,
} from "./types.js";

export class SharedRuntimeCoreController {
  private status: EngineStatus = "idle";
  private latestReport: SrtcRunReport | null = null;

  constructor(
    private readonly manager: RuntimeManager,
    private readonly config: SharedRuntimeCoreConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SharedRuntimeCoreDependencies = {}) {
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
      runtimeServices: [...this.config.runtimeServices],
      factoryKeys: [...this.config.factoryKeys],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      defaultFactories: this.config.defaultFactories.map((f) => ({ ...f, notes: [...(f.notes ?? [])] })),
      seedWorkers: this.config.seedWorkers.map((w) => ({ ...w, notes: [...(w.notes ?? [])] })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  registerDefaultFactories(input: SrtcInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerDefaultFactories(this.config, input));
  }

  registerFactory(input: SrtcInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerFactory(input, this.config));
  }

  registerWorker(input: SrtcInput = {}) {
    this.status = "registering";
    return this.finish(this.manager.registerWorker(input, this.config));
  }

  createExecutionContext(input: SrtcInput = {}) {
    this.status = "active";
    return this.finish(this.manager.createExecutionContext(input, this.config));
  }

  routeRequest(input: SrtcInput = {}) {
    this.status = "routing";
    return this.finish(this.manager.routeRequest(input, this.config));
  }

  resolveDependencies(input: SrtcInput = {}) {
    this.status = "resolving";
    return this.finish(this.manager.resolveDependencies(input, this.config));
  }

  collectDiagnostics(input: SrtcInput = {}) {
    this.status = "diagnosing";
    return this.finish(this.manager.collectDiagnostics(input, this.config));
  }

  produceSharedRuntimeReport(input: SrtcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceSharedRuntimeReport(input, this.config));
  }

  submitReport(input: SrtcInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list(input: SrtcInput = {}) {
    this.status = "active";
    return this.finish(this.manager.list(input, this.config));
  }

  validate(input: SrtcInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    this.status = "diagnosing";
    return this.finish(this.manager.diagnostics({}, this.config));
  }

  getTopology() {
    return this.manager.getTopology(this.config);
  }

  getQ1002ConsumableContract(): Q1002ConsumableContract {
    return this.manager.getQ1002ConsumableContract(this.config);
  }

  getCockpitSnapshot(): SharedRuntimeCoreCockpitSnapshot {
    const record = this.manager.getEngineRecord();
    const latest = this.manager.getReports().at(-1) ?? null;
    return {
      missionId: "Q10-01",
      status: this.status,
      healthStatus: record?.healthStatus ?? "standby",
      totalFactories: record?.totalFactories ?? 0,
      totalWorkers: record?.totalWorkers ?? 0,
      totalServices: record?.totalServices ?? 0,
      latestReportId: latest?.reportId ?? record?.lastReportId ?? null,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      workerId: this.config.workerId,
      neverReplaceFactoryLogic: true,
      neverReplaceWorkerLogic: true,
      neverExecuteBusinessSpecificDecisions: true,
      neverFabricateRuntimeState: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1002OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private finish(report: SrtcRunReport) {
    this.latestReport = report;
    if (report.decision === "fail") this.status = "failed";
    else if (this.status === "connecting") this.status = "active";
    return report;
  }
}
