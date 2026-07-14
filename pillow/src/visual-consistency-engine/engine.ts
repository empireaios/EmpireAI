import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import {
  appendConsistencyLog,
  getConsistencyLogs,
  resetConsistencyLogsForTesting,
} from "./visual-consistency-logging.js";
import { IntelligenceController } from "./intelligence-controller.js";
import {
  buildVisualConsistencyConfiguration,
  type VisualConsistencyConfiguration,
} from "./configuration.js";
import { VISUAL_CONSISTENCY_SYSTEM_PATH } from "./paths.js";
import type {
  VisualConsistencyCockpitSnapshot,
  VisualConsistencyState,
  ConsistencyReviewRecord,
  ConsistencyReviewReport,
} from "./types.js";

export interface VisualConsistencyEngineOptions {
  configuration?: Partial<VisualConsistencyConfiguration>;
}

/**
 * Visual Consistency Engine (PILLOW-VCE-001 / T2-07).
 * Checks EmpireAI interface visual consistency and supports unified design language.
 */
export class VisualConsistencyEngine {
  private initializedAt: string | null = null;
  private readonly controller: IntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    accessibilityIntelligence: AccessibilityIntelligenceEngine,
    options: VisualConsistencyEngineOptions = {},
  ) {
    const config = buildVisualConsistencyConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new IntelligenceController(
      {
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        designSystemIntelligence,
        executiveStyleLearning,
        layoutEvaluation,
        accessibilityIntelligence,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VisualConsistencyState> {
    const doc = await this.reader.readText(VISUAL_CONSISTENCY_SYSTEM_PATH);
    if (!doc?.includes("Visual Consistency")) {
      throw new Error(
        `${VISUAL_CONSISTENCY_SYSTEM_PATH} missing — Visual Consistency requires T2-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendConsistencyLog({
      event: "visual_consistency_initialized",
      level: "info",
      details: "Visual Consistency Engine initialized",
    });
    return this.getState();
  }

  getState(): VisualConsistencyState {
    if (!this.initializedAt) {
      throw new Error(
        "Visual Consistency Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      reviewsCompleted: performance.totalReviews,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-VCE-001",
      missionId: "T2-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestRecord: this.controller.getLatestRecord(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runReview(): ConsistencyReviewReport {
    return this.controller.runReview();
  }

  getLatestReport(): ConsistencyReviewReport | null {
    return this.controller.getLatestReport();
  }

  getLatestRecord(): ConsistencyReviewRecord | null {
    return this.controller.getLatestRecord();
  }

  stopVisualConsistency(): VisualConsistencyState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<VisualConsistencyConfiguration>,
  ): VisualConsistencyState {
    const next = buildVisualConsistencyConfiguration(this.bootstrap.repositoryRoot, {
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
        `Review status: ${state.status}`,
        `Reviews completed: ${state.performance.totalReviews}`,
        report
          ? `Last review: ${report.validation.decision} · ${report.record.consistencyFindings.length} findings`
          : "No review run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VisualConsistencyCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.latestRecord;

    return {
      reviewStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      findingsCount: record?.consistencyFindings.length ?? 0,
      strengthsCount: record?.consistencyStrengths.length ?? 0,
      severity: record?.severity ?? null,
      confidenceScore: record?.confidenceScore ?? 0,
      totalReviews: state.performance.totalReviews,
      recentLogs: getConsistencyLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createVisualConsistencyEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  accessibilityIntelligence: AccessibilityIntelligenceEngine,
  options?: VisualConsistencyEngineOptions,
): VisualConsistencyEngine {
  return new VisualConsistencyEngine(
    bootstrap,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    accessibilityIntelligence,
    options,
  );
}

export function resetVisualConsistencyForTesting(): void {
  resetConsistencyLogsForTesting();
}
