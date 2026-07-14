import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import {
  appendAccessibilityLog,
  getAccessibilityLogs,
  resetAccessibilityLogsForTesting,
} from "./accessibility-intelligence-logging.js";
import { IntelligenceController } from "./intelligence-controller.js";
import {
  buildAccessibilityIntelligenceConfiguration,
  type AccessibilityIntelligenceConfiguration,
} from "./configuration.js";
import { ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AccessibilityIntelligenceCockpitSnapshot,
  AccessibilityIntelligenceState,
  AccessibilityReviewRecord,
  AccessibilityReviewReport,
} from "./types.js";

export interface AccessibilityIntelligenceEngineOptions {
  configuration?: Partial<AccessibilityIntelligenceConfiguration>;
}

/**
 * Accessibility Intelligence Engine (PILLOW-AII-001 / T2-06).
 * Reviews EmpireAI interface accessibility and produces inclusive UX findings.
 */
export class AccessibilityIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: IntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uiStateMapper: UiStateMapperEngine,
    componentRecognition: ComponentRecognitionEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    options: AccessibilityIntelligenceEngineOptions = {},
  ) {
    const config = buildAccessibilityIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new IntelligenceController(
      {
        uiStateMapper,
        componentRecognition,
        layoutUnderstanding,
        navigationMapping,
        interactionTracking,
        contextAwareness,
        workflowOptimization,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AccessibilityIntelligenceState> {
    const doc = await this.reader.readText(ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Accessibility Intelligence")) {
      throw new Error(
        `${ACCESSIBILITY_INTELLIGENCE_SYSTEM_PATH} missing — Accessibility Intelligence requires T2-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAccessibilityLog({
      event: "accessibility_intelligence_initialized",
      level: "info",
      details: "Accessibility Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): AccessibilityIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Accessibility Intelligence Engine not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-AII-001",
      missionId: "T2-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestRecord: this.controller.getLatestRecord(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runReview(): AccessibilityReviewReport {
    return this.controller.runReview();
  }

  getLatestReport(): AccessibilityReviewReport | null {
    return this.controller.getLatestReport();
  }

  getLatestRecord(): AccessibilityReviewRecord | null {
    return this.controller.getLatestRecord();
  }

  stopAccessibilityIntelligence(): AccessibilityIntelligenceState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<AccessibilityIntelligenceConfiguration>,
  ): AccessibilityIntelligenceState {
    const next = buildAccessibilityIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
          ? `Last review: ${report.validation.decision} · ${report.record.accessibilityFindings.length} findings`
          : "No review run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AccessibilityIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.latestRecord;

    return {
      reviewStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      findingsCount: record?.accessibilityFindings.length ?? 0,
      strengthsCount: record?.accessibilityStrengths.length ?? 0,
      severity: record?.severity ?? null,
      confidenceScore: record?.confidenceScore ?? 0,
      totalReviews: state.performance.totalReviews,
      recentLogs: getAccessibilityLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createAccessibilityIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  uiStateMapper: UiStateMapperEngine,
  componentRecognition: ComponentRecognitionEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  options?: AccessibilityIntelligenceEngineOptions,
): AccessibilityIntelligenceEngine {
  return new AccessibilityIntelligenceEngine(
    bootstrap,
    uiStateMapper,
    componentRecognition,
    layoutUnderstanding,
    navigationMapping,
    interactionTracking,
    contextAwareness,
    workflowOptimization,
    options,
  );
}

export function resetAccessibilityIntelligenceForTesting(): void {
  resetAccessibilityLogsForTesting();
}
