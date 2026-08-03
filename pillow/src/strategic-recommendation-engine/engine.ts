import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildStrategicRecommendationEngineConfiguration,
  type StrategicRecommendationEngineConfiguration,
} from "./configuration.js";
import { StrategicRecommendationController } from "./strategic-recommendation-controller.js";
import { StrategicRecommendationManager } from "./strategic-recommendation-manager.js";
import { resetRecLogsForTesting } from "./rec-logging.js";
import { resetAnalysisSequenceForTesting } from "./empire-state-analyzer.js";
import { resetRecommendationSequenceForTesting } from "./recommendation-generator.js";
import { STRATEGIC_RECOMMENDATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  StrategicRecommendationCockpitSnapshot,
  StrategicRecommendationInput,
  StrategicRecommendationEngineState,
} from "./types.js";

export interface StrategicRecommendationEngineOptions {
  configuration?: Partial<StrategicRecommendationEngineConfiguration>;
}

/** Authoritative Q0-07 Strategic Recommendation Engine — analyses and recommends only. */
export class StrategicRecommendationEngine {
  private initializedAt: string | null = null;
  private readonly controller: StrategicRecommendationController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: StrategicRecommendationEngineOptions = {},
  ) {
    this.controller = new StrategicRecommendationController(
      new StrategicRecommendationManager(),
      buildStrategicRecommendationEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      STRATEGIC_RECOMMENDATION_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Strategic Recommendation Engine")) {
      throw new Error(
        `${STRATEGIC_RECOMMENDATION_ENGINE_SYSTEM_PATH} missing — Q0-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): StrategicRecommendationEngineState {
    if (!this.initializedAt) {
      throw new Error("Strategic Recommendation Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getRecommendations().length;
    return {
      engineVersion: "PILLOW-REC-001",
      missionId: "Q0-07",
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
        totalRecommendations: total,
        notes: [
          "Recommend only: does not execute recommendations, assign workers, approve actions, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectStrategicRecommendationEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  analyseState(input: StrategicRecommendationInput = {}) {
    return this.controller.analyseState(input);
  }

  generateRecommendations(input: StrategicRecommendationInput = {}) {
    return this.controller.generateRecommendations(input);
  }

  rankRecommendations(input: StrategicRecommendationInput = {}) {
    return this.controller.rankRecommendations(input);
  }

  producePackages(input: StrategicRecommendationInput = {}) {
    return this.controller.producePackages(input);
  }

  validateRecommendations(input: StrategicRecommendationInput = {}) {
    return this.controller.validateRecommendations(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  getLatestAnalysis() {
    return this.controller.getManager().getLatestAnalysis();
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
        `Recommendations: ${state.health.totalRecommendations}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): StrategicRecommendationCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-07",
      status: state.status,
      healthStatus: state.health.status,
      totalRecommendations: state.health.totalRecommendations,
      latestRecommendationId: this.getRecommendations()[0]?.recommendationId ?? null,
      lastAnalysisId: this.getLatestAnalysis()?.analysisId ?? null,
      neverExecuteRecommendations: true,
      neverAssignWorkers: true,
      neverApproveActions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createStrategicRecommendationEngine(
  bootstrap: EmpireBootstrapContext,
  options?: StrategicRecommendationEngineOptions,
) {
  return new StrategicRecommendationEngine(bootstrap, options);
}

export function resetStrategicRecommendationEngineForTesting() {
  resetRecLogsForTesting();
  resetAnalysisSequenceForTesting();
  resetRecommendationSequenceForTesting();
}
