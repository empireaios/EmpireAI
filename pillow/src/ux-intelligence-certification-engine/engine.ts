import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { VisualFoundationCertificationEngine } from "../visual-foundation-certification-engine/engine.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./certification-logging.js";
import { CertificationController } from "./certification-controller.js";
import {
  buildUxIntelligenceCertificationConfiguration,
  type UxIntelligenceCertificationConfiguration,
} from "./configuration.js";
import { UX_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationCockpitSnapshot,
  UxIntelligenceCertificationReport,
  UxIntelligenceCertificationState,
} from "./types.js";

export interface UxIntelligenceCertificationEngineOptions {
  configuration?: Partial<UxIntelligenceCertificationConfiguration>;
}

/**
 * UX Intelligence Certification Engine (PILLOW-UIC-001 / T2-10).
 * Validates the complete T2 UX Intelligence pipeline (T2-01 through T2-09).
 */
export class UxIntelligenceCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uxRuleEngine: UxRuleEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    accessibilityIntelligence: AccessibilityIntelligenceEngine,
    visualConsistency: VisualConsistencyEngine,
    uxScoring: UxScoringEngine,
    recommendationEngine: RecommendationEngine,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    visualFoundationCertification: VisualFoundationCertificationEngine | null,
    options: UxIntelligenceCertificationEngineOptions = {},
  ) {
    const config = buildUxIntelligenceCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CertificationController(
      bootstrap.repositoryRoot,
      {
        uxRuleEngine,
        designSystemIntelligence,
        executiveStyleLearning,
        layoutEvaluation,
        workflowOptimization,
        accessibilityIntelligence,
        visualConsistency,
        uxScoring,
        recommendationEngine,
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        interactionTracking,
        visualFoundationCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<UxIntelligenceCertificationState> {
    const doc = await this.reader.readText(UX_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("UX Intelligence Certification")) {
      throw new Error(
        `${UX_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH} missing — UX Intelligence Certification requires T2-10 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "certification_engine_initialized",
      level: "info",
      details: "UX Intelligence Certification Engine initialized",
    });
    return this.getState();
  }

  getState(): UxIntelligenceCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "UX Intelligence Certification Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-UIC-001",
      missionId: "T2-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCertification(): Promise<UxIntelligenceCertificationReport> {
    return this.controller.runCertification();
  }

  getLatestReport(): UxIntelligenceCertificationReport | null {
    return this.controller.getLatestReport();
  }

  updateConfiguration(
    overrides: Partial<UxIntelligenceCertificationConfiguration>,
  ): UxIntelligenceCertificationState {
    const next = buildUxIntelligenceCertificationConfiguration(this.bootstrap.repositoryRoot, {
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
      ? report.finalCertificationDecision === "pass"
        ? 100
        : report.finalCertificationDecision === "conditional"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last decision: ${report.finalCertificationDecision} · ${report.missionResults.filter((m) => m.passed).length}/${report.missionResults.length} missions passed`
          : "No certification run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const missionsPassed = report?.missionResults.filter((m) => m.passed).length ?? 0;
    const missionsFailed = report ? report.missionResults.length - missionsPassed : 0;

    return {
      certificationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.finalCertificationDecision ?? state.health.lastCertificationDecision,
      missionsPassed,
      missionsFailed,
      endToEndPassed: report?.endToEndValidationResult.passed ?? false,
      totalCertifications: state.performance.totalCertifications,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createUxIntelligenceCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  uxRuleEngine: UxRuleEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  accessibilityIntelligence: AccessibilityIntelligenceEngine,
  visualConsistency: VisualConsistencyEngine,
  uxScoring: UxScoringEngine,
  recommendationEngine: RecommendationEngine,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  visualFoundationCertification: VisualFoundationCertificationEngine | null,
  options?: UxIntelligenceCertificationEngineOptions,
): UxIntelligenceCertificationEngine {
  return new UxIntelligenceCertificationEngine(
    bootstrap,
    uxRuleEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    layoutEvaluation,
    workflowOptimization,
    accessibilityIntelligence,
    visualConsistency,
    uxScoring,
    recommendationEngine,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    visualFoundationCertification,
    options,
  );
}

export function resetUxIntelligenceCertificationForTesting(): void {
  resetCertificationLogsForTesting();
}
