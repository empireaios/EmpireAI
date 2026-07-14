import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import {
  appendLayoutEvaluationLog,
  getLayoutEvaluationLogs,
  resetLayoutEvaluationLogsForTesting,
} from "./layout-evaluation-logging.js";
import { EvaluationController } from "./evaluation-controller.js";
import {
  buildLayoutEvaluationConfiguration,
  type LayoutEvaluationConfiguration,
} from "./configuration.js";
import { LAYOUT_EVALUATION_SYSTEM_PATH } from "./paths.js";
import type {
  LayoutEvaluationCockpitSnapshot,
  LayoutEvaluationModel,
  LayoutEvaluationReport,
  LayoutEvaluationState,
} from "./types.js";

export interface LayoutEvaluationEngineOptions {
  configuration?: Partial<LayoutEvaluationConfiguration>;
}

/**
 * Layout Evaluation Engine (PILLOW-LEV-001 / T2-04).
 * Automatically evaluates layouts and identifies UX weaknesses.
 */
export class LayoutEvaluationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EvaluationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    layoutUnderstanding: LayoutUnderstandingEngine,
    componentRecognition: ComponentRecognitionEngine,
    navigationMapping: NavigationMappingEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    uxRuleEngine: UxRuleEngine,
    options: LayoutEvaluationEngineOptions = {},
  ) {
    const config = buildLayoutEvaluationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new EvaluationController(
      {
        layoutUnderstanding,
        componentRecognition,
        navigationMapping,
        designSystemIntelligence,
        executiveStyleLearning,
        uxRuleEngine,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LayoutEvaluationState> {
    const doc = await this.reader.readText(LAYOUT_EVALUATION_SYSTEM_PATH);
    if (!doc?.includes("Layout Evaluation")) {
      throw new Error(
        `${LAYOUT_EVALUATION_SYSTEM_PATH} missing — Layout Evaluation requires T2-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLayoutEvaluationLog({
      event: "layout_evaluation_initialized",
      level: "info",
      details: "Layout Evaluation Engine initialized",
    });
    return this.getState();
  }

  getState(): LayoutEvaluationState {
    if (!this.initializedAt) {
      throw new Error("Layout Evaluation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      evaluationsCompleted: performance.totalEvaluations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LEV-001",
      missionId: "T2-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestModel: this.controller.getLatestModel(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runEvaluation(): LayoutEvaluationReport {
    return this.controller.runEvaluation();
  }

  getLatestReport(): LayoutEvaluationReport | null {
    return this.controller.getLatestReport();
  }

  getLatestModel(): LayoutEvaluationModel | null {
    return this.controller.getLatestModel();
  }

  stopLayoutEvaluation(): LayoutEvaluationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<LayoutEvaluationConfiguration>,
  ): LayoutEvaluationState {
    const next = buildLayoutEvaluationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Evaluation status: ${state.status}`,
        `Evaluations completed: ${state.performance.totalEvaluations}`,
        report
          ? `Last evaluation: ${report.validation.decision} · ${report.model.layoutWeaknesses.length} weaknesses`
          : "No evaluation run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LayoutEvaluationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const model = state.latestModel;

    return {
      evaluationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      overallStatus: model?.overallEvaluationStatus ?? null,
      strengthsCount: model?.layoutStrengths.length ?? 0,
      weaknessesCount: model?.layoutWeaknesses.length ?? 0,
      ruleViolationsCount: model?.ruleViolations.length ?? 0,
      confidenceScore: model?.confidenceScore ?? 0,
      totalEvaluations: state.performance.totalEvaluations,
      recentLogs: getLayoutEvaluationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createLayoutEvaluationEngine(
  bootstrap: EmpireBootstrapContext,
  layoutUnderstanding: LayoutUnderstandingEngine,
  componentRecognition: ComponentRecognitionEngine,
  navigationMapping: NavigationMappingEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  uxRuleEngine: UxRuleEngine,
  options?: LayoutEvaluationEngineOptions,
): LayoutEvaluationEngine {
  return new LayoutEvaluationEngine(
    bootstrap,
    layoutUnderstanding,
    componentRecognition,
    navigationMapping,
    designSystemIntelligence,
    executiveStyleLearning,
    uxRuleEngine,
    options,
  );
}

export function resetLayoutEvaluationForTesting(): void {
  resetLayoutEvaluationLogsForTesting();
}
