import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import {
  appendRecommendationLog,
  getRecommendationLogs,
  resetRecommendationLogsForTesting,
} from "./recommendation-logging.js";
import { IntelligenceController } from "./intelligence-controller.js";
import {
  buildRecommendationEngineConfiguration,
  type RecommendationEngineConfiguration,
} from "./configuration.js";
import { RECOMMENDATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  RecommendationCockpitSnapshot,
  RecommendationEngineState,
  RecommendationRecord,
  RecommendationReport,
} from "./types.js";

export interface RecommendationEngineOptions {
  configuration?: Partial<RecommendationEngineConfiguration>;
}

/**
 * Recommendation Engine (PILLOW-REC-001 / T2-09).
 * Generates actionable redesign proposals from UX intelligence findings.
 */
export class RecommendationEngine {
  private initializedAt: string | null = null;
  private readonly controller: IntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    navigationMapping: NavigationMappingEngine,
    uxRuleEngine: UxRuleEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    accessibilityIntelligence: AccessibilityIntelligenceEngine,
    visualConsistency: VisualConsistencyEngine,
    uxScoring: UxScoringEngine,
    options: RecommendationEngineOptions = {},
  ) {
    const config = buildRecommendationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new IntelligenceController(
      {
        uiStateMapper,
        navigationMapping,
        uxRuleEngine,
        designSystemIntelligence,
        executiveStyleLearning,
        layoutEvaluation,
        workflowOptimization,
        accessibilityIntelligence,
        visualConsistency,
        uxScoring,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RecommendationEngineState> {
    const doc = await this.reader.readText(RECOMMENDATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Recommendation Engine")) {
      throw new Error(
        `${RECOMMENDATION_ENGINE_SYSTEM_PATH} missing — Recommendation Engine requires T2-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRecommendationLog({
      event: "recommendation_engine_ready",
      level: "info",
      details: "Recommendation Engine initialized",
    });
    return this.getState();
  }

  getState(): RecommendationEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Recommendation Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      reportsCompleted: performance.totalReports,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-REC-001",
      missionId: "T2-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestRecord: this.controller.getLatestRecord(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generateRecommendations(): RecommendationReport {
    return this.controller.generateRecommendations();
  }

  getLatestReport(): RecommendationReport | null {
    return this.controller.getLatestReport();
  }

  getLatestRecord(): RecommendationRecord | null {
    return this.controller.getLatestRecord();
  }

  stopRecommendationEngine(): RecommendationEngineState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<RecommendationEngineConfiguration>,
  ): RecommendationEngineState {
    const next = buildRecommendationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Reports generated: ${state.performance.totalReports}`,
        report
          ? `Last report: ${report.validation.decision} · ${report.record.proposals.length} proposals`
          : "No recommendations generated yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RecommendationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.latestRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      proposalsCount: record?.proposals.length ?? 0,
      criticalCount: record?.proposals.filter((p) => p.priority === "critical").length ?? 0,
      highPriorityCount: record?.proposals.filter((p) => p.priority === "high").length ?? 0,
      confidenceScore: record?.confidenceScore ?? 0,
      totalReports: state.performance.totalReports,
      recentLogs: getRecommendationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createRecommendationEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  navigationMapping: NavigationMappingEngine,
  uxRuleEngine: UxRuleEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  accessibilityIntelligence: AccessibilityIntelligenceEngine,
  visualConsistency: VisualConsistencyEngine,
  uxScoring: UxScoringEngine,
  options?: RecommendationEngineOptions,
): RecommendationEngine {
  return new RecommendationEngine(
    bootstrap,
    uiStateMapper,
    navigationMapping,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    options,
  );
}

export function resetRecommendationEngineForTesting(): void {
  resetRecommendationLogsForTesting();
}
