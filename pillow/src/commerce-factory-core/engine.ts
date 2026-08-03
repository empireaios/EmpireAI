import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCommerceFactoryCoreConfiguration,
  type CommerceFactoryCoreConfiguration,
} from "./configuration.js";
import type { CommerceFactoryCoreDependencies } from "./integrations.js";
import { CommerceFactoryCoreController } from "./commerce-factory-core-controller.js";
import { resetCmfLogsForTesting } from "./cmf-logging.js";
import { COMMERCE_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { CommerceFactoryManager } from "./factory-manager.js";
import type {
  CommerceFactoryCoreCockpitSnapshot,
  CommerceFactoryCoreInput,
  CommerceFactoryCoreState,
} from "./types.js";

export interface CommerceFactoryCoreOptions {
  configuration?: Partial<CommerceFactoryCoreConfiguration>;
  dependencies?: CommerceFactoryCoreDependencies;
}

/** Authoritative Q3-01 Commerce Factory Core — prepare commerce missions only. */
export class CommerceFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: CommerceFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CommerceFactoryCoreOptions = {},
  ) {
    const manager = new CommerceFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new CommerceFactoryCoreController(
      manager,
      buildCommerceFactoryCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COMMERCE_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Commerce Factory Core")) {
      throw new Error(
        `${COMMERCE_FACTORY_CORE_SYSTEM_PATH} missing — Q3-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: CommerceFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): CommerceFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error("Commerce Factory Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CMF-001",
      missionId: "Q3-01",
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
          "Preparation-only: does not build stores, import products, configure marketplaces, execute commerce implementation, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectCommerceFactoryCore(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessBlueprint(input: CommerceFactoryCoreInput = {}) {
    return this.controller.receiveBlueprint(input);
  }

  receiveBusinessApprovalPack(input: CommerceFactoryCoreInput = {}) {
    return this.controller.receiveApprovalPack(input);
  }

  verifyGrandKingApproval(input: CommerceFactoryCoreInput = {}) {
    return this.controller.verifyApproval(input);
  }

  verifyBlueprintCompleteness(input: CommerceFactoryCoreInput = {}) {
    return this.controller.verifyBlueprint(input);
  }

  verifyImplementationPrerequisites(input: CommerceFactoryCoreInput = {}) {
    return this.controller.verifyPrerequisites(input);
  }

  createCommerceBuildMission(input: CommerceFactoryCoreInput = {}) {
    return this.controller.createMission(input);
  }

  classifyCommerceBusinessType(input: CommerceFactoryCoreInput = {}) {
    return this.controller.classifyCommerceType(input);
  }

  registerCommerceBuildMission(input: CommerceFactoryCoreInput = {}) {
    return this.controller.registerMission(input);
  }

  produceCommerceBuildMission(input: CommerceFactoryCoreInput = {}) {
    return this.controller.produceMission(input);
  }

  submitCommerceBuildMission(input: CommerceFactoryCoreInput = {}) {
    return this.controller.submitMission(input);
  }

  listCommerceBuildMissions() {
    return this.controller.list();
  }

  validateCommerceFactoryCore(input: CommerceFactoryCoreInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getMissions() {
    return this.controller.getManager().getMissions();
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
        `Commerce missions: ${state.health.totalMissions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CommerceFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q3-01",
      status: state.status,
      healthStatus: state.health.status,
      totalMissions: state.health.totalMissions,
      latestMissionId: this.getLatestMissionId(),
      workerId: state.configuration.workerId,
      neverBuildStores: true,
      neverImportProducts: true,
      neverConfigureMarketplaces: true,
      neverExecuteCommerceImplementation: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createCommerceFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: CommerceFactoryCoreOptions,
) {
  return new CommerceFactoryCore(bootstrap, options);
}

export function resetCommerceFactoryCoreForTesting() {
  resetCmfLogsForTesting();
  resetMissionSequenceForTesting();
}
