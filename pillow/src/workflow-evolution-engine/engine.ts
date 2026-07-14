import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import {
  buildWorkflowEvolutionConfiguration,
  type WorkflowEvolutionConfiguration,
} from "./configuration.js";
import {
  appendEvolutionLog,
  getEvolutionLogs,
  resetEvolutionLogsForTesting,
} from "./workflow-logging.js";
import { WORKFLOW_EVOLUTION_SYSTEM_PATH } from "./paths.js";
import type {
  WorkflowEvolutionCockpitSnapshot,
  WorkflowEvolutionInput,
  WorkflowEvolutionRunReport,
  WorkflowEvolutionState,
} from "./types.js";
import { WorkflowEvolutionController } from "./workflow-evolution-controller.js";
import { WorkflowEvolutionManager } from "./workflow-evolution-manager.js";

export interface WorkflowEvolutionOptions {
  configuration?: Partial<WorkflowEvolutionConfiguration>;
}

/**
 * Workflow Evolution Engine (PILLOW-WFE-001 / T5-05).
 * Continuous identification of workflow improvements that reduce friction.
 * Safety: recommend only — never executes workflow changes automatically.
 */
export class WorkflowEvolutionEngine {
  private initializedAt: string | null = null;
  private readonly controller: WorkflowEvolutionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    productivityIntelligence: ProductivityIntelligenceEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    options: WorkflowEvolutionOptions = {},
  ) {
    const config = buildWorkflowEvolutionConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new WorkflowEvolutionController(
      {
        productivityIntelligence,
        uxOpportunityDiscovery,
        autonomousUxAudit,
        continuousScreenObservation,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WorkflowEvolutionState> {
    const doc = await this.reader.readText(WORKFLOW_EVOLUTION_SYSTEM_PATH);
    if (!doc?.includes("Workflow Evolution")) {
      throw new Error(
        `${WORKFLOW_EVOLUTION_SYSTEM_PATH} missing — Workflow Evolution requires T5-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEvolutionLog({
      event: "workflow_evolution_ready",
      level: "info",
      details: "T5-05 Workflow Evolution initialized",
    });
    return this.getState();
  }

  getState(): WorkflowEvolutionState {
    if (!this.initializedAt) {
      throw new Error("Workflow Evolution not initialized. Call initialize() first.");
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
      continuousEvolutionActive: this.controller.isContinuousEvolutionActive(),
    });

    return {
      engineVersion: "PILLOW-WFE-001",
      missionId: "T5-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      topRecommendations: this.controller.getTopRecommendations(),
      health,
      performance,
    };
  }

  evolve(input: WorkflowEvolutionInput = {}): WorkflowEvolutionRunReport {
    return this.controller.evolve(input);
  }

  startContinuousEvolution(): WorkflowEvolutionState {
    this.controller.startContinuousEvolution();
    return this.getState();
  }

  stopContinuousEvolution(): WorkflowEvolutionState {
    this.controller.stopContinuousEvolution();
    return this.getState();
  }

  getLatestReport(): WorkflowEvolutionRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopRecommendations() {
    return this.controller.getTopRecommendations();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<WorkflowEvolutionConfiguration>,
  ): WorkflowEvolutionState {
    const next = buildWorkflowEvolutionConfiguration(this.bootstrap.repositoryRoot, {
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
        `Evolution cycles: ${state.performance.totalEvolutionCycles}`,
        `Recommendations: ${state.performance.totalRecommendations}`,
        `Continuous evolution: ${state.health.continuousEvolutionActive ? "active" : "inactive"}`,
        report
          ? `Last evolution: ${report.validation.decision}`
          : "No evolution cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkflowEvolutionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topRecommendations[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousEvolutionActive: state.health.continuousEvolutionActive,
      totalEvolutionCycles: state.performance.totalEvolutionCycles,
      totalRecommendations: state.performance.totalRecommendations,
      topPriorityCount: state.topRecommendations.filter(
        (r) => r.priority === "critical" || r.priority === "high",
      ).length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      recentLogs: getEvolutionLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createWorkflowEvolutionEngine(
  bootstrap: EmpireBootstrapContext,
  productivityIntelligence: ProductivityIntelligenceEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  options?: WorkflowEvolutionOptions,
): WorkflowEvolutionEngine {
  return new WorkflowEvolutionEngine(
    bootstrap,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    options,
  );
}

export function resetWorkflowEvolutionForTesting(): void {
  resetEvolutionLogsForTesting();
  new WorkflowEvolutionManager().resetForTesting();
}
