import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import {
  appendBuildLog,
  getBuildLogs,
  resetBuildLogsForTesting,
} from "./build-logging.js";
import { BuildController } from "./build-controller.js";
import {
  buildFrontendBuilderConfiguration,
  type FrontendBuilderConfiguration,
} from "./configuration.js";
import { FRONTEND_BUILDER_SYSTEM_PATH } from "./paths.js";
import type {
  FrontendBuilderCockpitSnapshot,
  FrontendBuilderState,
  FrontendBuildReport,
} from "./types.js";

export interface FrontendBuilderOptions {
  configuration?: Partial<FrontendBuilderConfiguration>;
}

/**
 * Frontend Builder (PILLOW-FB-001 / T3-01).
 * Generates frontend code from approved UX intelligence recommendations.
 */
export class FrontendBuilder {
  private initializedAt: string | null = null;
  private readonly controller: BuildController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    navigationMapping: NavigationMappingEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    uxScoring: UxScoringEngine,
    recommendationEngine: RecommendationEngine,
    uxIntelligenceCertification: UxIntelligenceCertificationEngine,
    options: FrontendBuilderOptions = {},
  ) {
    const config = buildFrontendBuilderConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new BuildController(
      {
        uiStateMapper,
        navigationMapping,
        designSystemIntelligence,
        executiveStyleLearning,
        uxScoring,
        recommendationEngine,
        uxIntelligenceCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FrontendBuilderState> {
    const doc = await this.reader.readText(FRONTEND_BUILDER_SYSTEM_PATH);
    if (!doc?.includes("Frontend Builder")) {
      throw new Error(
        `${FRONTEND_BUILDER_SYSTEM_PATH} missing — Frontend Builder requires T3-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBuildLog({
      event: "frontend_builder_ready",
      level: "info",
      details: "Frontend Builder initialized",
    });
    return this.getState();
  }

  getState(): FrontendBuilderState {
    if (!this.initializedAt) {
      throw new Error("Frontend Builder not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      buildsCompleted: performance.totalBuilds,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FB-001",
      missionId: "T3-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generateFrontendCode(): FrontendBuildReport {
    return this.controller.generateFrontendCode();
  }

  getLatestReport(): FrontendBuildReport | null {
    return this.controller.getLatestReport();
  }

  stopFrontendBuilder(): FrontendBuilderState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<FrontendBuilderConfiguration>,
  ): FrontendBuilderState {
    const next = buildFrontendBuilderConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Builds completed: ${state.performance.totalBuilds}`,
        report
          ? `Last build: ${report.validation.decision} · ${report.records.length} records`
          : "No frontend builds generated yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FrontendBuilderCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      recordsCount: report?.records.length ?? 0,
      validatedCount:
        report?.records.filter((r) => r.buildStatus === "validated").length ?? 0,
      blockedCount: report?.records.filter((r) => r.buildStatus === "blocked").length ?? 0,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              report.records.reduce((s, r) => s + r.confidenceScore, 0) /
                report.records.length,
            )
          : 0,
      totalBuilds: state.performance.totalBuilds,
      recentLogs: getBuildLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createFrontendBuilder(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  navigationMapping: NavigationMappingEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  uxScoring: UxScoringEngine,
  recommendationEngine: RecommendationEngine,
  uxIntelligenceCertification: UxIntelligenceCertificationEngine,
  options?: FrontendBuilderOptions,
): FrontendBuilder {
  return new FrontendBuilder(
    bootstrap,
    uiStateMapper,
    navigationMapping,
    designSystemIntelligence,
    executiveStyleLearning,
    uxScoring,
    recommendationEngine,
    uxIntelligenceCertification,
    options,
  );
}

export function resetFrontendBuilderForTesting(): void {
  resetBuildLogsForTesting();
}
