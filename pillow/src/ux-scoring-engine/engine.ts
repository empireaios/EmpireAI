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
import {
  appendScoringLog,
  getScoringLogs,
  resetScoringLogsForTesting,
} from "./ux-scoring-logging.js";
import { IntelligenceController } from "./intelligence-controller.js";
import {
  buildUxScoringConfiguration,
  type UxScoringConfiguration,
} from "./configuration.js";
import { UX_SCORING_SYSTEM_PATH } from "./paths.js";
import type {
  UxScoringCockpitSnapshot,
  UxScoringState,
  UxScoreRecord,
  UxScoringReport,
} from "./types.js";

export interface UxScoringEngineOptions {
  configuration?: Partial<UxScoringConfiguration>;
}

/**
 * UX Scoring Engine (PILLOW-UXS-001 / T2-08).
 * Converts UX intelligence findings into measurable UX quality scores.
 */
export class UxScoringEngine {
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
    options: UxScoringEngineOptions = {},
  ) {
    const config = buildUxScoringConfiguration(bootstrap.repositoryRoot, options.configuration);
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
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<UxScoringState> {
    const doc = await this.reader.readText(UX_SCORING_SYSTEM_PATH);
    if (!doc?.includes("UX Scoring")) {
      throw new Error(
        `${UX_SCORING_SYSTEM_PATH} missing — UX Scoring requires T2-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendScoringLog({
      event: "ux_scoring_initialized",
      level: "info",
      details: "UX Scoring Engine initialized",
    });
    return this.getState();
  }

  getState(): UxScoringState {
    if (!this.initializedAt) {
      throw new Error("UX Scoring Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      scoresCompleted: performance.totalScorings,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-UXS-001",
      missionId: "T2-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestRecord: this.controller.getLatestRecord(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runScoring(): UxScoringReport {
    return this.controller.runScoring();
  }

  getLatestReport(): UxScoringReport | null {
    return this.controller.getLatestReport();
  }

  getLatestRecord(): UxScoreRecord | null {
    return this.controller.getLatestRecord();
  }

  stopUxScoring(): UxScoringState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(overrides: Partial<UxScoringConfiguration>): UxScoringState {
    const next = buildUxScoringConfiguration(this.bootstrap.repositoryRoot, {
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
        `Scoring status: ${state.status}`,
        `Scores completed: ${state.performance.totalScorings}`,
        report
          ? `Last scoring: ${report.validation.decision} · overall ${report.record.overallUxScore}`
          : "No scoring run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): UxScoringCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.latestRecord;

    return {
      scoringStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      overallUxScore: record?.overallUxScore ?? 0,
      passThreshold: state.configuration.passThreshold,
      categoriesScored: record?.scoreBreakdown.length ?? 0,
      confidenceScore: record?.confidenceScore ?? 0,
      totalScorings: state.performance.totalScorings,
      recentLogs: getScoringLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createUxScoringEngine(
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
  options?: UxScoringEngineOptions,
): UxScoringEngine {
  return new UxScoringEngine(
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
    options,
  );
}

export function resetUxScoringForTesting(): void {
  resetScoringLogsForTesting();
}
