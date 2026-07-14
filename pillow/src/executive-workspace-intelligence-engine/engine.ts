import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContinuousUxEvolutionEngine } from "../continuous-ux-evolution-engine/engine.js";
import type { AdaptiveInterfaceEngine } from "../adaptive-interface-engine/engine.js";
import type { WorkflowEvolutionEngine } from "../workflow-evolution-engine/engine.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import {
  buildExecutiveWorkspaceIntelligenceConfiguration,
  type ExecutiveWorkspaceIntelligenceConfiguration,
} from "./configuration.js";
import {
  appendWorkspaceLog,
  getWorkspaceLogs,
  resetWorkspaceLogsForTesting,
} from "./ewi-logging.js";
import { EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutiveWorkspaceIntelligenceCockpitSnapshot,
  ExecutiveWorkspaceIntelligenceInput,
  ExecutiveWorkspaceIntelligenceRunReport,
  ExecutiveWorkspaceIntelligenceState,
} from "./types.js";
import { ExecutiveWorkspaceIntelligenceController } from "./executive-workspace-intelligence-controller.js";
import { ExecutiveWorkspaceIntelligenceManager } from "./executive-workspace-intelligence-manager.js";

export interface ExecutiveWorkspaceIntelligenceOptions {
  configuration?: Partial<ExecutiveWorkspaceIntelligenceConfiguration>;
}

/**
 * Executive Workspace Intelligence Engine (PILLOW-EWI-001 / T5-08).
 * Mission-specific dashboard and workspace optimization recommendations.
 * Safety: recommend only — never modifies workspace without Grand King approval.
 */
export class ExecutiveWorkspaceIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveWorkspaceIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    continuousUxEvolution: ContinuousUxEvolutionEngine,
    adaptiveInterface: AdaptiveInterfaceEngine,
    workflowEvolution: WorkflowEvolutionEngine,
    productivityIntelligence: ProductivityIntelligenceEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    options: ExecutiveWorkspaceIntelligenceOptions = {},
  ) {
    const config = buildExecutiveWorkspaceIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ExecutiveWorkspaceIntelligenceController(
      {
        continuousUxEvolution,
        adaptiveInterface,
        workflowEvolution,
        productivityIntelligence,
        uxOpportunityDiscovery,
        autonomousUxAudit,
        continuousScreenObservation,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveWorkspaceIntelligenceState> {
    const doc = await this.reader.readText(EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Executive Workspace Intelligence")) {
      throw new Error(
        `${EXECUTIVE_WORKSPACE_INTELLIGENCE_SYSTEM_PATH} missing — Executive Workspace Intelligence requires T5-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWorkspaceLog({
      event: "executive_workspace_intelligence_ready",
      level: "info",
      details: "T5-08 Executive Workspace Intelligence initialized",
    });
    return this.getState();
  }

  getState(): ExecutiveWorkspaceIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Executive Workspace Intelligence not initialized. Call initialize() first.",
      );
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
      continuousOptimizationActive: this.controller.isContinuousOptimizationActive(),
    });

    return {
      engineVersion: "PILLOW-EWI-001",
      missionId: "T5-08",
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

  optimizeWorkspace(
    input: ExecutiveWorkspaceIntelligenceInput = {},
  ): ExecutiveWorkspaceIntelligenceRunReport {
    return this.controller.optimizeWorkspace(input);
  }

  startContinuousOptimization(): ExecutiveWorkspaceIntelligenceState {
    this.controller.startContinuousOptimization();
    return this.getState();
  }

  stopContinuousOptimization(): ExecutiveWorkspaceIntelligenceState {
    this.controller.stopContinuousOptimization();
    return this.getState();
  }

  getLatestReport(): ExecutiveWorkspaceIntelligenceRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopRecommendations() {
    return this.controller.getTopRecommendations();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveWorkspaceIntelligenceConfiguration>,
  ): ExecutiveWorkspaceIntelligenceState {
    const next = buildExecutiveWorkspaceIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Optimization cycles: ${state.performance.totalOptimizationCycles}`,
        `Recommendations: ${state.performance.totalRecommendations}`,
        `Continuous optimization: ${state.health.continuousOptimizationActive ? "active" : "inactive"}`,
        report
          ? `Last optimization: ${report.validation.decision}`
          : "No optimization cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveWorkspaceIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topRecommendations[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousOptimizationActive: state.health.continuousOptimizationActive,
      totalOptimizationCycles: state.performance.totalOptimizationCycles,
      totalRecommendations: state.performance.totalRecommendations,
      topPriorityCount: state.topRecommendations.filter(
        (r) => r.workspacePriority === "critical" || r.workspacePriority === "high",
      ).length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      activeMissionContext: top?.activeMissionContext ?? null,
      recentLogs: getWorkspaceLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createExecutiveWorkspaceIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  continuousUxEvolution: ContinuousUxEvolutionEngine,
  adaptiveInterface: AdaptiveInterfaceEngine,
  workflowEvolution: WorkflowEvolutionEngine,
  productivityIntelligence: ProductivityIntelligenceEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  options?: ExecutiveWorkspaceIntelligenceOptions,
): ExecutiveWorkspaceIntelligenceEngine {
  return new ExecutiveWorkspaceIntelligenceEngine(
    bootstrap,
    continuousUxEvolution,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    options,
  );
}

export function resetExecutiveWorkspaceIntelligenceForTesting(): void {
  resetWorkspaceLogsForTesting();
  new ExecutiveWorkspaceIntelligenceManager().resetForTesting();
}
