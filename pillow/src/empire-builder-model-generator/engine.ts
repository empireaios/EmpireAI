import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildEmpireBuilderModelGeneratorConfiguration,
  type EmpireBuilderModelGeneratorConfiguration,
} from "./configuration.js";
import { resetModelSequenceForTesting } from "./model-builder.js";
import { EMPIRE_BUILDER_MODEL_GENERATOR_SYSTEM_PATH } from "./paths.js";
import { EmpireBuilderModelGeneratorController } from "./empire-builder-model-generator-controller.js";
import { EmpireBuilderModelGeneratorManager } from "./model-manager.js";
import { resetEmgLogsForTesting } from "./emg-logging.js";
import type {
  EmpireBuilderModelGeneratorCockpitSnapshot,
  EmpireBuilderModelGeneratorInput,
  EmpireBuilderModelGeneratorState,
} from "./types.js";

export interface EmpireBuilderModelGeneratorOptions {
  configuration?: Partial<EmpireBuilderModelGeneratorConfiguration>;
}

/** Authoritative Q2-03 Empire Builder Model Generator — blueprint only. */
export class EmpireBuilderModelGenerator {
  private initializedAt: string | null = null;
  private readonly controller: EmpireBuilderModelGeneratorController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: EmpireBuilderModelGeneratorOptions = {},
  ) {
    this.controller = new EmpireBuilderModelGeneratorController(
      new EmpireBuilderModelGeneratorManager(),
      buildEmpireBuilderModelGeneratorConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EMPIRE_BUILDER_MODEL_GENERATOR_SYSTEM_PATH,
    );
    if (!doc?.includes("Empire Builder Model Generator")) {
      throw new Error(
        `${EMPIRE_BUILDER_MODEL_GENERATOR_SYSTEM_PATH} missing — Q2-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): EmpireBuilderModelGeneratorState {
    if (!this.initializedAt) {
      throw new Error(
        "Empire Builder Model Generator not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EMG-001",
      missionId: "Q2-03",
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
        totalModels: engineRecord?.totalModels ?? 0,
        lastBusinessModelId: engineRecord?.lastBusinessModelId ?? null,
        notes: [
          "Blueprint-only: does not validate demand, research markets, build branding, assign workers, launch businesses, or implement Q2-04+.",
        ],
      },
    };
  }

  connectEmpireBuilderModelGenerator(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessIntent(input: EmpireBuilderModelGeneratorInput = {}) {
    return this.controller.receiveIntent(input);
  }

  generateBusinessModel(input: EmpireBuilderModelGeneratorInput = {}) {
    return this.controller.generateModel(input);
  }

  produceBusinessModel(input: EmpireBuilderModelGeneratorInput = {}) {
    return this.controller.produce(input);
  }

  listBusinessModels() {
    return this.controller.list();
  }

  validateEmpireBuilderModelGenerator(input: EmpireBuilderModelGeneratorInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getModels() {
    return this.controller.getManager().getModels();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestModelId() {
    return this.controller.getManager().getLatestModelId();
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
        `Models: ${state.health.totalModels}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EmpireBuilderModelGeneratorCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-03",
      status: state.status,
      healthStatus: state.health.status,
      totalModels: state.health.totalModels,
      latestBusinessModelId: this.getLatestModelId(),
      neverValidateDemand: true,
      neverPerformMarketResearch: true,
      neverBuildBranding: true,
      neverAssignWorkers: true,
      neverLaunchBusiness: true,
      neverImplementQ204OrLater: true,
    };
  }
}

export function createEmpireBuilderModelGenerator(
  bootstrap: EmpireBootstrapContext,
  options?: EmpireBuilderModelGeneratorOptions,
) {
  return new EmpireBuilderModelGenerator(bootstrap, options);
}

export function resetEmpireBuilderModelGeneratorForTesting() {
  resetEmgLogsForTesting();
  resetModelSequenceForTesting();
}
