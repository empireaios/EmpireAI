import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AdaptiveInterfaceEngine } from "../adaptive-interface-engine/engine.js";
import type { WorkflowEvolutionEngine } from "../workflow-evolution-engine/engine.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import {
  buildContinuousUxEvolutionConfiguration,
  type ContinuousUxEvolutionConfiguration,
} from "./configuration.js";
import {
  appendEvolutionLog,
  getEvolutionLogs,
  resetEvolutionLogsForTesting,
} from "./cue-logging.js";
import { CONTINUOUS_UX_EVOLUTION_SYSTEM_PATH } from "./paths.js";
import type {
  ContinuousUxEvolutionCockpitSnapshot,
  ContinuousUxEvolutionInput,
  ContinuousUxEvolutionRunReport,
  ContinuousUxEvolutionState,
} from "./types.js";
import { ContinuousUxEvolutionController } from "./continuous-ux-evolution-controller.js";
import { ContinuousUxEvolutionManager } from "./continuous-ux-evolution-manager.js";

export interface ContinuousUxEvolutionOptions {
  configuration?: Partial<ContinuousUxEvolutionConfiguration>;
}

/**
 * Continuous UX Evolution Engine (PILLOW-CUE-001 / T5-07).
 * Ongoing UX optimization recommendations from accumulated intelligence.
 * Safety: recommend only — never applies UX changes without Grand King approval.
 */
export class ContinuousUxEvolutionEngine {
  private initializedAt: string | null = null;
  private readonly controller: ContinuousUxEvolutionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    adaptiveInterface: AdaptiveInterfaceEngine,
    workflowEvolution: WorkflowEvolutionEngine,
    productivityIntelligence: ProductivityIntelligenceEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    options: ContinuousUxEvolutionOptions = {},
  ) {
    const config = buildContinuousUxEvolutionConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ContinuousUxEvolutionController(
      {
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

  async initialize(): Promise<ContinuousUxEvolutionState> {
    const doc = await this.reader.readText(CONTINUOUS_UX_EVOLUTION_SYSTEM_PATH);
    if (!doc?.includes("Continuous UX Evolution")) {
      throw new Error(
        `${CONTINUOUS_UX_EVOLUTION_SYSTEM_PATH} missing — Continuous UX Evolution requires T5-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEvolutionLog({
      event: "continuous_ux_evolution_ready",
      level: "info",
      details: "T5-07 Continuous UX Evolution initialized",
    });
    return this.getState();
  }

  getState(): ContinuousUxEvolutionState {
    if (!this.initializedAt) {
      throw new Error(
        "Continuous UX Evolution not initialized. Call initialize() first.",
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
      continuousEvolutionActive: this.controller.isContinuousEvolutionActive(),
    });

    return {
      engineVersion: "PILLOW-CUE-001",
      missionId: "T5-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      evolutionHistory: this.controller.getEvolutionHistory(),
      topImprovements: this.controller.getTopImprovements(),
      health,
      performance,
    };
  }

  optimize(input: ContinuousUxEvolutionInput = {}): ContinuousUxEvolutionRunReport {
    return this.controller.optimize(input);
  }

  startContinuousEvolution(): ContinuousUxEvolutionState {
    this.controller.startContinuousEvolution();
    return this.getState();
  }

  stopContinuousEvolution(): ContinuousUxEvolutionState {
    this.controller.stopContinuousEvolution();
    return this.getState();
  }

  getLatestReport(): ContinuousUxEvolutionRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopImprovements() {
    return this.controller.getTopImprovements();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  getEvolutionHistory() {
    return this.controller.getEvolutionHistory();
  }

  updateConfiguration(
    overrides: Partial<ContinuousUxEvolutionConfiguration>,
  ): ContinuousUxEvolutionState {
    const next = buildContinuousUxEvolutionConfiguration(this.bootstrap.repositoryRoot, {
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
        `Improvements: ${state.performance.totalImprovements}`,
        `Continuous evolution: ${state.health.continuousEvolutionActive ? "active" : "inactive"}`,
        report
          ? `Last evolution: ${report.validation.decision}`
          : "No evolution cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ContinuousUxEvolutionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topImprovements[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousEvolutionActive: state.health.continuousEvolutionActive,
      totalEvolutionCycles: state.performance.totalEvolutionCycles,
      totalImprovements: state.performance.totalImprovements,
      topPriorityCount: state.topImprovements.filter(
        (r) => r.improvementPriority === "critical" || r.improvementPriority === "high",
      ).length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      dominantEvolutionCategory: top?.evolutionCategory ?? null,
      recentLogs: getEvolutionLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createContinuousUxEvolutionEngine(
  bootstrap: EmpireBootstrapContext,
  adaptiveInterface: AdaptiveInterfaceEngine,
  workflowEvolution: WorkflowEvolutionEngine,
  productivityIntelligence: ProductivityIntelligenceEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  options?: ContinuousUxEvolutionOptions,
): ContinuousUxEvolutionEngine {
  return new ContinuousUxEvolutionEngine(
    bootstrap,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    options,
  );
}

export function resetContinuousUxEvolutionForTesting(): void {
  resetEvolutionLogsForTesting();
  new ContinuousUxEvolutionManager().resetForTesting();
}
