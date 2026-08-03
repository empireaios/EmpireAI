import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalBusinessFactoryCoreConfiguration,
  type LocalBusinessFactoryCoreConfiguration,
} from "./configuration.js";
import type { LocalBusinessFactoryCoreDependencies } from "./integrations.js";
import { LocalBusinessFactoryCoreController } from "./local-business-factory-core-controller.js";
import { resetLbfcLogsForTesting } from "./lbfc-logging.js";
import { LOCAL_BUSINESS_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { LocalBusinessFactoryManager } from "./factory-manager.js";
import type {
  LocalBusinessFactoryCoreCockpitSnapshot,
  LocalBusinessFactoryCoreInput,
  LocalBusinessFactoryCoreState,
} from "./types.js";

export interface LocalBusinessFactoryCoreOptions {
  configuration?: Partial<LocalBusinessFactoryCoreConfiguration>;
  dependencies?: LocalBusinessFactoryCoreDependencies;
}

/** Authoritative Q7-01 Local Business Factory Core — executive orchestration only. */
export class LocalBusinessFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: LocalBusinessFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LocalBusinessFactoryCoreOptions = {},
  ) {
    const manager = new LocalBusinessFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LocalBusinessFactoryCoreController(
      manager,
      buildLocalBusinessFactoryCoreConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LOCAL_BUSINESS_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Local Business Factory Core")) {
      throw new Error(
        `${LOCAL_BUSINESS_FACTORY_CORE_SYSTEM_PATH} missing — Q7-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LocalBusinessFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LocalBusinessFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error(
        "Local Business Factory Core not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LBFC-001",
      missionId: "Q7-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalProjects: engineRecord?.totalProjects ?? 0,
        lastProjectId: engineRecord?.lastProjectId ?? null,
        notes: [
          "Orchestration-only: does not perform specialist Q7 worker functions, replace Q7 workers, fabricate operational status, bypass Grand King approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerLocalBusinessProject(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.registerLocalBusinessProject(input);
  }

  coordinateLifecycle(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateLifecycle(input);
  }

  trackProjectProgress(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.trackProjectProgress(input);
  }

  coordinateWorkers(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  assignWorkers(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.assignWorkers(input);
  }

  coordinateApproval(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateApproval(input);
  }

  coordinateLaunchReadiness(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateLaunchReadiness(input);
  }

  coordinateCustomerAcquisition(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateCustomerAcquisition(input);
  }

  coordinateFulfilment(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateFulfilment(input);
  }

  coordinateOngoingOperations(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.coordinateOngoingOperations(input);
  }

  produceReport(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.produceReport(input);
  }

  produceLocalBusinessFactoryReport(input: LocalBusinessFactoryCoreInput = {}) {
    return this.controller.produceLocalBusinessFactoryReport(input);
  }

  submitReport(input: LocalBusinessFactoryCoreInput = {}) {
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

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validate(input: LocalBusinessFactoryCoreInput = {}) {
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
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Local business projects: ${state.health.totalProjects}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LocalBusinessFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-01",
      status: state.status,
      healthStatus: state.health.status,
      totalProjects: state.health.totalProjects,
      latestProjectId: this.getLatestProjectId(),
      workerId: state.configuration.workerId,
      neverPerformSpecialistWorkerFunctions: true,
      neverReplaceQ7Workers: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverFabricateOperationalStatus: true,
      neverImplementQ702OrLater: true,
    };
  }
}

export function createLocalBusinessFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: LocalBusinessFactoryCoreOptions,
) {
  return new LocalBusinessFactoryCore(bootstrap, options);
}

export function resetLocalBusinessFactoryCoreForTesting() {
  resetLbfcLogsForTesting();
  resetMissionSequenceForTesting();
}
