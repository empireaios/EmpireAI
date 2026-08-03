import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEmpireBuilderFactoryCoreConfiguration,
  type EmpireBuilderFactoryCoreConfiguration,
} from "./configuration.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { EMPIRE_BUILDER_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { EmpireBuilderFactoryCoreController } from "./empire-builder-factory-core-controller.js";
import { EmpireBuilderFactoryManager } from "./factory-manager.js";
import { resetEbfLogsForTesting } from "./ebf-logging.js";
import type {
  EmpireBuilderFactoryCockpitSnapshot,
  EmpireBuilderFactoryCoreState,
  EmpireBuilderFactoryInput,
} from "./types.js";

export interface EmpireBuilderFactoryCoreOptions {
  configuration?: Partial<EmpireBuilderFactoryCoreConfiguration>;
}

/** Authoritative Q2-01 Empire Builder Factory Core — mission containers only. */
export class EmpireBuilderFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: EmpireBuilderFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EmpireBuilderFactoryCoreOptions = {},
  ) {
    this.controller = new EmpireBuilderFactoryCoreController(
      new EmpireBuilderFactoryManager(),
      buildEmpireBuilderFactoryCoreConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EMPIRE_BUILDER_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Empire Builder Factory Core")) {
      throw new Error(
        `${EMPIRE_BUILDER_FACTORY_CORE_SYSTEM_PATH} missing — Q2-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireBuilderFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error(
        "Empire Builder Factory Core not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EBF-001",
      missionId: "Q2-01",
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
          "Mission-container only: does not interpret strategy, generate models, research markets, assign workers, execute/launch businesses, or implement Q2-02+.",
        ],
      },
    };
  }

  connectEmpireBuilderFactoryCore(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  acceptGrandKingCommand(input: EmpireBuilderFactoryInput = {}) {
    return this.controller.acceptCommand(input);
  }

  createBusinessBuildMission(input: EmpireBuilderFactoryInput = {}) {
    return this.controller.createMission(input);
  }

  classifyBusinessType(input: EmpireBuilderFactoryInput = {}) {
    return this.controller.classifyBusinessType(input);
  }

  prepareMission(input: EmpireBuilderFactoryInput = {}) {
    return this.controller.prepareMission(input);
  }

  produceMission(input: EmpireBuilderFactoryInput = {}) {
    return this.controller.produce(input);
  }

  listMissions() {
    return this.controller.list();
  }

  validateEmpireBuilderFactoryCore(input: EmpireBuilderFactoryInput = {}) {
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
        `Missions: ${state.health.totalMissions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EmpireBuilderFactoryCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-01",
      status: state.status,
      healthStatus: state.health.status,
      totalMissions: state.health.totalMissions,
      latestMissionId: this.getLatestMissionId(),
      neverInterpretDetailedBusinessStrategy: true,
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverAssignWorkers: true,
      neverExecuteBusinesses: true,
      neverLaunchBusinesses: true,
      neverImplementQ202OrLater: true,
    };
  }
}

export function createEmpireBuilderFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: EmpireBuilderFactoryCoreOptions,
) {
  return new EmpireBuilderFactoryCore(bootstrap, options);
}

export function resetEmpireBuilderFactoryCoreForTesting() {
  resetEbfLogsForTesting();
  resetMissionSequenceForTesting();
}
