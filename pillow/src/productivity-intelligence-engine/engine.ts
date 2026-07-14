import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { ContinuousCollaborationEngine } from "../continuous-collaboration/engine.js";
import {
  buildProductivityIntelligenceConfiguration,
  type ProductivityIntelligenceConfiguration,
} from "./configuration.js";
import {
  appendProductivityLog,
  getProductivityLogs,
  resetProductivityLogsForTesting,
} from "./productivity-logging.js";
import { PRODUCTIVITY_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ProductivityIntelligenceCockpitSnapshot,
  ProductivityIntelligenceInput,
  ProductivityIntelligenceState,
  ProductivityLearningRunReport,
} from "./types.js";
import { ProductivityIntelligenceController } from "./productivity-intelligence-controller.js";
import { ProductivityIntelligenceManager } from "./productivity-intelligence-manager.js";

export interface ProductivityIntelligenceOptions {
  configuration?: Partial<ProductivityIntelligenceConfiguration>;
}

/**
 * Productivity Intelligence Engine (PILLOW-PIE-001 / T5-04).
 * Continuous learning of workflow patterns and productivity behavior.
 * Safety: learn only — never executes workflow changes automatically.
 */
export class ProductivityIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: ProductivityIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    interactionTracking: InteractionTrackingEngine,
    contextAwareness: ContextAwarenessEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    uxScoring: UxScoringEngine,
    continuousCollaboration: ContinuousCollaborationEngine,
    options: ProductivityIntelligenceOptions = {},
  ) {
    const config = buildProductivityIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ProductivityIntelligenceController(
      {
        uxOpportunityDiscovery,
        autonomousUxAudit,
        continuousScreenObservation,
        interactionTracking,
        contextAwareness,
        workflowOptimization,
        uxScoring,
        continuousCollaboration,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProductivityIntelligenceState> {
    const doc = await this.reader.readText(PRODUCTIVITY_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Productivity Intelligence")) {
      throw new Error(
        `${PRODUCTIVITY_INTELLIGENCE_SYSTEM_PATH} missing — Productivity Intelligence requires T5-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendProductivityLog({
      event: "productivity_intelligence_ready",
      level: "info",
      details: "T5-04 Productivity Intelligence initialized",
    });
    return this.getState();
  }

  getState(): ProductivityIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Productivity Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getSessionManager().getActiveSessionCount(),
      continuousLearningActive: this.controller.isContinuousLearningActive(),
    });

    return {
      engineVersion: "PILLOW-PIE-001",
      missionId: "T5-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      topPatterns: this.controller.getTopPatterns(),
      health,
      performance,
    };
  }

  learn(input: ProductivityIntelligenceInput = {}): ProductivityLearningRunReport {
    return this.controller.learn(input);
  }

  startContinuousLearning(): ProductivityIntelligenceState {
    this.controller.startContinuousLearning();
    return this.getState();
  }

  stopContinuousLearning(): ProductivityIntelligenceState {
    this.controller.stopContinuousLearning();
    return this.getState();
  }

  getLatestReport(): ProductivityLearningRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopPatterns() {
    return this.controller.getTopPatterns();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<ProductivityIntelligenceConfiguration>,
  ): ProductivityIntelligenceState {
    const next = buildProductivityIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Learning cycles: ${state.performance.totalLearningCycles}`,
        `Patterns learned: ${state.performance.totalPatternsLearned}`,
        `Continuous learning: ${state.health.continuousLearningActive ? "active" : "inactive"}`,
        report
          ? `Last learning: ${report.validation.decision}`
          : "No learning cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductivityIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topPatterns[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousLearningActive: state.health.continuousLearningActive,
      totalLearningCycles: state.performance.totalLearningCycles,
      totalPatternsLearned: state.performance.totalPatternsLearned,
      topConfidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      recentLogs: getProductivityLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createProductivityIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  interactionTracking: InteractionTrackingEngine,
  contextAwareness: ContextAwarenessEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  uxScoring: UxScoringEngine,
  continuousCollaboration: ContinuousCollaborationEngine,
  options?: ProductivityIntelligenceOptions,
): ProductivityIntelligenceEngine {
  return new ProductivityIntelligenceEngine(
    bootstrap,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    interactionTracking,
    contextAwareness,
    workflowOptimization,
    uxScoring,
    continuousCollaboration,
    options,
  );
}

export function resetProductivityIntelligenceForTesting(): void {
  resetProductivityLogsForTesting();
  new ProductivityIntelligenceManager().resetForTesting();
}
