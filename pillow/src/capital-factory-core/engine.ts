import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCapitalFactoryCoreConfiguration,
  type CapitalFactoryCoreConfiguration,
} from "./configuration.js";
import type { CapitalFactoryCoreDependencies } from "./integrations.js";
import { CapitalFactoryCoreController } from "./capital-factory-core-controller.js";
import { resetCapfcLogsForTesting } from "./capfc-logging.js";
import { CAPITAL_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetProjectSequenceForTesting } from "./project-builder.js";
import { CapitalFactoryManager } from "./factory-manager.js";
import type {
  CapfcInput,
  CapitalFactoryCoreCockpitSnapshot,
  CapitalFactoryCoreState,
} from "./types.js";

export interface CapitalFactoryCoreOptions {
  configuration?: Partial<CapitalFactoryCoreConfiguration>;
  dependencies?: CapitalFactoryCoreDependencies;
}

/**
 * Authoritative Q9-01 Capital Factory Core — executive orchestration only.
 *
 * CAPFC orchestrates capital projects (registration, lifecycle, worker role
 * coordination, dependency management, readiness monitoring, reporting). It does NOT
 * perform accounting, forecast finances, or execute investments
 * automatically — those remain out of scope for Q9-02 and later specialist workers.
 */
export class CapitalFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: CapitalFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CapitalFactoryCoreOptions = {},
  ) {
    const manager = new CapitalFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CapitalFactoryCoreController(
      manager,
      buildCapitalFactoryCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CAPITAL_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Capital Factory Core")) {
      throw new Error(`${CAPITAL_FACTORY_CORE_SYSTEM_PATH} missing — Q9-01 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CapitalFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CapitalFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error("Capital Factory Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CAPFC-001",
      missionId: "Q9-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalProjects: engineRecord?.totalProjects ?? 0,
        lastProjectId: engineRecord?.lastProjectId ?? null,
        notes: [
          "Orchestration-only: does not perform accounting, forecast finances, execute investments automatically, fabricate worker status, bypass Grand King approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createCapitalProject(input: CapfcInput = {}) {
    return this.controller.registerCapitalProject(input);
  }

  registerCapitalProject(input: CapfcInput = {}) {
    return this.controller.registerCapitalProject(input);
  }

  manageLifecycle(input: CapfcInput = {}) {
    return this.controller.coordinateLifecycle(input);
  }

  coordinateLifecycle(input: CapfcInput = {}) {
    return this.controller.coordinateLifecycle(input);
  }

  coordinateWorkers(input: CapfcInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  assignWorkers(input: CapfcInput = {}) {
    return this.controller.assignWorkers(input);
  }

  trackProjectStatus(input: CapfcInput = {}) {
    return this.controller.trackProjectStatus(input);
  }

  trackProjectProgress(input: CapfcInput = {}) {
    return this.controller.trackProjectProgress(input);
  }

  manageWorkerDependencies(input: CapfcInput = {}) {
    return this.controller.manageWorkerDependencies(input);
  }

  maintainBusinessMetadata(input: CapfcInput = {}) {
    return this.controller.maintainBusinessMetadata(input);
  }

  monitorFactoryReadiness() {
    return this.controller.monitorFactoryReadiness();
  }

  produceExecutiveSummary(input: CapfcInput = {}) {
    return this.controller.produceExecutiveSummary(input);
  }

  produceReport(input: CapfcInput = {}) {
    return this.controller.produceReport(input);
  }

  produceCapitalFactoryReport(input: CapfcInput = {}) {
    return this.controller.produceCapitalFactoryReport(input);
  }

  submitReport(input: CapfcInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getProjects() {
    return this.controller.getManager().getProjects();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestProjectId() {
    return this.controller.getManager().getLatestProjectId();
  }

  getLatestCapitalBusinessId() {
    return this.controller.getManager().getLatestCapitalBusinessId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ902ConsumableContract() {
    return this.controller.getQ902ConsumableContract();
  }

  validate(input: CapfcInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Capital projects: ${state.health.totalProjects}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CapitalFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q9-01",
      status: state.status,
      healthStatus: state.health.status,
      totalProjects: state.health.totalProjects,
      latestCapitalBusinessId: this.getLatestCapitalBusinessId(),
      workerId: state.configuration.workerId,
      neverPerformAccounting: true,
      neverForecastFinances: true,
      neverExecuteInvestmentsAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ902OrLater: true,
    };
  }
}

export function createCapitalFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: CapitalFactoryCoreOptions,
) {
  return new CapitalFactoryCore(bootstrap, options);
}

export function resetCapitalFactoryCoreForTesting() {
  resetCapfcLogsForTesting();
  resetProjectSequenceForTesting();
}
