import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDecisionEngineConfiguration,
  type DecisionEngineConfiguration,
} from "./configuration.js";
import { DecisionEngineController } from "./decision-engine-controller.js";
import { DecisionEngineManager } from "./decision-engine-manager.js";
import { resetDeLogsForTesting } from "./de-logging.js";
import { resetOptionSequenceForTesting } from "./option-generator.js";
import { DECISION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  DecisionEngineCockpitSnapshot,
  DecisionEngineInput,
  DecisionEngineState,
} from "./types.js";

export interface DecisionEngineOptions {
  configuration?: Partial<DecisionEngineConfiguration>;
}

/** Authoritative Q0-05 Decision Engine — evaluates options and recommends actions. */
export class DecisionEngine {
  private initializedAt: string | null = null;
  private readonly controller: DecisionEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DecisionEngineOptions = {},
  ) {
    this.controller = new DecisionEngineController(
      new DecisionEngineManager(),
      buildDecisionEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(DECISION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Decision Engine")) {
      throw new Error(`${DECISION_ENGINE_SYSTEM_PATH} missing — Q0-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): DecisionEngineState {
    if (!this.initializedAt) throw new Error("Decision Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getPackages().length;
    return {
      engineVersion: "PILLOW-DE-001",
      missionId: "Q0-05",
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
        totalDecisions: count,
        notes: [
          "Evaluation only: does not execute work, assign workers, approve actions, override Pillow, or replace Grand King approval.",
        ],
      },
    };
  }

  connectDecisionEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitProblem(input: DecisionEngineInput) {
    return this.controller.submitProblem(input);
  }

  generateOptions(input: DecisionEngineInput) {
    return this.controller.generateOptions(input);
  }

  evaluateOptions(input: DecisionEngineInput) {
    return this.controller.evaluateOptions(input);
  }

  produceDecisionPackage(input: DecisionEngineInput) {
    return this.controller.produceDecisionPackage(input);
  }

  validateDecision(input: DecisionEngineInput = { executiveObjective: "" }) {
    return this.controller.validateDecision(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getPackages() {
    return this.controller.getManager().getPackages();
  }

  getLatestPackage() {
    return this.controller.getManager().getLatestPackage();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Decisions: ${state.health.totalDecisions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DecisionEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-05",
      status: state.status,
      healthStatus: state.health.status,
      totalDecisions: state.health.totalDecisions,
      latestDecisionId: this.getLatestPackage()?.decisionId ?? null,
      neverExecuteWork: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverOverridePillow: true,
      neverReplaceGrandKingApproval: true,
    };
  }
}

export function createDecisionEngine(
  bootstrap: EmpireBootstrapContext,
  options?: DecisionEngineOptions,
) {
  return new DecisionEngine(bootstrap, options);
}

export function resetDecisionEngineForTesting() {
  resetDeLogsForTesting();
  resetOptionSequenceForTesting();
}
