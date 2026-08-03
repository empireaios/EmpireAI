import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEnterprisePlatformFactoryCoreConfiguration,
  type EnterprisePlatformFactoryCoreConfiguration,
} from "./configuration.js";
import type { EnterprisePlatformFactoryCoreDependencies } from "./integrations.js";
import { EnterprisePlatformFactoryCoreController } from "./enterprise-platform-factory-core-controller.js";
import { resetEpfcLogsForTesting } from "./epfc-logging.js";
import { ENTERPRISE_PLATFORM_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { EnterprisePlatformFactoryManager } from "./factory-manager.js";
import type {
  EnterprisePlatformFactoryCoreCockpitSnapshot,
  EnterprisePlatformFactoryCoreInput,
  EnterprisePlatformFactoryCoreState,
} from "./types.js";

export interface EnterprisePlatformFactoryCoreOptions {
  configuration?: Partial<EnterprisePlatformFactoryCoreConfiguration>;
  dependencies?: EnterprisePlatformFactoryCoreDependencies;
}

/** Authoritative Q6-01 Enterprise Platform Factory Core — executive orchestration only. */
export class EnterprisePlatformFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: EnterprisePlatformFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EnterprisePlatformFactoryCoreOptions = {},
  ) {
    const manager = new EnterprisePlatformFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new EnterprisePlatformFactoryCoreController(
      manager,
      buildEnterprisePlatformFactoryCoreConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ENTERPRISE_PLATFORM_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Enterprise Platform Factory Core")) {
      throw new Error(
        `${ENTERPRISE_PLATFORM_FACTORY_CORE_SYSTEM_PATH} missing — Q6-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: EnterprisePlatformFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): EnterprisePlatformFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error(
        "Enterprise Platform Factory Core not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EPFC-001",
      missionId: "Q6-01",
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
        totalMissions: engineRecord?.totalMissions ?? 0,
        lastMissionId: engineRecord?.lastMissionId ?? null,
        notes: [
          "Orchestration-only: does not build frontend/backend, design databases, bypass Grand King approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createEnterprisePlatformMission(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.createEnterprisePlatformMission(input);
  }

  registerSoftwarePlatform(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.registerSoftwarePlatform(input);
  }

  coordinateSoftwareDevelopmentLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateSoftwareDevelopmentLifecycle(input);
  }

  coordinateArchitectureDecisions(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateArchitectureDecisions(input);
  }

  coordinateImplementationWorkers(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateImplementationWorkers(input);
  }

  coordinateTestingWorkflows(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateTestingWorkflows(input);
  }

  coordinateDeploymentWorkflows(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateDeploymentWorkflows(input);
  }

  coordinateProductionOperations(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateProductionOperations(input);
  }

  trackPlatformLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.trackPlatformLifecycle(input);
  }

  manageLifecycle(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.manageLifecycle(input);
  }

  coordinateWorkers(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  coordinateApproval(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.coordinateApproval(input);
  }

  produceReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.produceReport(input);
  }

  produceEnterprisePlatformFactoryReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.produceEnterprisePlatformFactoryReport(input);
  }

  submitReport(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: EnterprisePlatformFactoryCoreInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getMissions() {
    return this.controller.getManager().getMissions();
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

  getLatestMissionId() {
    return this.controller.getManager().getLatestMissionId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
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
        `Enterprise platform missions: ${state.health.totalMissions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EnterprisePlatformFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q6-01",
      status: state.status,
      healthStatus: state.health.status,
      totalMissions: state.health.totalMissions,
      latestMissionId: this.getLatestMissionId(),
      workerId: state.configuration.workerId,
      neverBuildFrontend: true,
      neverBuildBackend: true,
      neverDesignDatabases: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createEnterprisePlatformFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: EnterprisePlatformFactoryCoreOptions,
) {
  return new EnterprisePlatformFactoryCore(bootstrap, options);
}

export function resetEnterprisePlatformFactoryCoreForTesting() {
  resetEpfcLogsForTesting();
  resetMissionSequenceForTesting();
}
