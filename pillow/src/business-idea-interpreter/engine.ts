import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessIdeaInterpreterConfiguration,
  type BusinessIdeaInterpreterConfiguration,
} from "./configuration.js";
import { resetIntentSequenceForTesting } from "./intent-builder.js";
import { BUSINESS_IDEA_INTERPRETER_SYSTEM_PATH } from "./paths.js";
import { BusinessIdeaInterpreterController } from "./business-idea-interpreter-controller.js";
import { BusinessIdeaInterpreterManager } from "./interpreter-manager.js";
import { resetBiiLogsForTesting } from "./bii-logging.js";
import type {
  BusinessIdeaInterpreterCockpitSnapshot,
  BusinessIdeaInterpreterInput,
  BusinessIdeaInterpreterState,
} from "./types.js";

export interface BusinessIdeaInterpreterOptions {
  configuration?: Partial<BusinessIdeaInterpreterConfiguration>;
}

/** Authoritative Q2-02 Business Idea Interpreter — structured intent only. */
export class BusinessIdeaInterpreter {
  private initializedAt: string | null = null;
  private readonly controller: BusinessIdeaInterpreterController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessIdeaInterpreterOptions = {},
  ) {
    this.controller = new BusinessIdeaInterpreterController(
      new BusinessIdeaInterpreterManager(),
      buildBusinessIdeaInterpreterConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BUSINESS_IDEA_INTERPRETER_SYSTEM_PATH,
    );
    if (!doc?.includes("Business Idea Interpreter")) {
      throw new Error(
        `${BUSINESS_IDEA_INTERPRETER_SYSTEM_PATH} missing — Q2-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): BusinessIdeaInterpreterState {
    if (!this.initializedAt) {
      throw new Error("Business Idea Interpreter not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BII-001",
      missionId: "Q2-02",
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
        totalIntents: engineRecord?.totalIntents ?? 0,
        lastIntentId: engineRecord?.lastIntentId ?? null,
        notes: [
          "Interpret-only: does not generate models, research markets, build businesses, assign workers, execute anything, or implement Q2-03+.",
        ],
      },
    };
  }

  connectBusinessIdeaInterpreter(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  acceptBusinessCommand(input: BusinessIdeaInterpreterInput = {}) {
    return this.controller.acceptCommand(input);
  }

  interpretBusinessIdea(input: BusinessIdeaInterpreterInput = {}) {
    return this.controller.interpret(input);
  }

  produceIntent(input: BusinessIdeaInterpreterInput = {}) {
    return this.controller.produce(input);
  }

  listIntents() {
    return this.controller.list();
  }

  validateBusinessIdeaInterpreter(input: BusinessIdeaInterpreterInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getIntents() {
    return this.controller.getManager().getIntents();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestIntentId() {
    return this.controller.getManager().getLatestIntentId();
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
        `Intents: ${state.health.totalIntents}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessIdeaInterpreterCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-02",
      status: state.status,
      healthStatus: state.health.status,
      totalIntents: state.health.totalIntents,
      latestIntentId: this.getLatestIntentId(),
      neverGenerateBusinessModels: true,
      neverResearchMarkets: true,
      neverBuildBusinesses: true,
      neverAssignWorkers: true,
      neverExecuteAnything: true,
      neverImplementQ203OrLater: true,
    };
  }
}

export function createBusinessIdeaInterpreter(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessIdeaInterpreterOptions,
) {
  return new BusinessIdeaInterpreter(bootstrap, options);
}

export function resetBusinessIdeaInterpreterForTesting() {
  resetBiiLogsForTesting();
  resetIntentSequenceForTesting();
}
