import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { WorkflowEvolutionEngine } from "../workflow-evolution-engine/engine.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import {
  buildAdaptiveInterfaceConfiguration,
  type AdaptiveInterfaceConfiguration,
} from "./configuration.js";
import {
  appendAdaptiveLog,
  getAdaptiveLogs,
  resetAdaptiveLogsForTesting,
} from "./adaptive-logging.js";
import { ADAPTIVE_INTERFACE_SYSTEM_PATH } from "./paths.js";
import type {
  AdaptiveInterfaceCockpitSnapshot,
  AdaptiveInterfaceInput,
  AdaptiveInterfaceRunReport,
  AdaptiveInterfaceState,
} from "./types.js";
import { AdaptiveInterfaceController } from "./adaptive-interface-controller.js";
import { AdaptiveInterfaceManager } from "./adaptive-interface-manager.js";

export interface AdaptiveInterfaceOptions {
  configuration?: Partial<AdaptiveInterfaceConfiguration>;
}

/**
 * Adaptive Interface Engine (PILLOW-AIE-001 / T5-06).
 * Context-aware interface personalization recommendations.
 * Safety: recommend only — never modifies interface without Grand King approval.
 */
export class AdaptiveInterfaceEngine {
  private initializedAt: string | null = null;
  private readonly controller: AdaptiveInterfaceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    workflowEvolution: WorkflowEvolutionEngine,
    productivityIntelligence: ProductivityIntelligenceEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    contextAwareness: ContextAwarenessEngine,
    interactionTracking: InteractionTrackingEngine,
    options: AdaptiveInterfaceOptions = {},
  ) {
    const config = buildAdaptiveInterfaceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new AdaptiveInterfaceController(
      {
        workflowEvolution,
        productivityIntelligence,
        uxOpportunityDiscovery,
        autonomousUxAudit,
        continuousScreenObservation,
        contextAwareness,
        interactionTracking,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AdaptiveInterfaceState> {
    const doc = await this.reader.readText(ADAPTIVE_INTERFACE_SYSTEM_PATH);
    if (!doc?.includes("Adaptive Interface")) {
      throw new Error(
        `${ADAPTIVE_INTERFACE_SYSTEM_PATH} missing — Adaptive Interface requires T5-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAdaptiveLog({
      event: "adaptive_interface_ready",
      level: "info",
      details: "T5-06 Adaptive Interface initialized",
    });
    return this.getState();
  }

  getState(): AdaptiveInterfaceState {
    if (!this.initializedAt) {
      throw new Error("Adaptive Interface not initialized. Call initialize() first.");
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
      continuousAdaptationActive: this.controller.isContinuousAdaptationActive(),
    });

    return {
      engineVersion: "PILLOW-AIE-001",
      missionId: "T5-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      activeProfile: this.controller.getActiveProfile(),
      topAdaptations: this.controller.getTopAdaptations(),
      health,
      performance,
    };
  }

  adapt(input: AdaptiveInterfaceInput = {}): AdaptiveInterfaceRunReport {
    return this.controller.adapt(input);
  }

  startContinuousAdaptation(): AdaptiveInterfaceState {
    this.controller.startContinuousAdaptation();
    return this.getState();
  }

  stopContinuousAdaptation(): AdaptiveInterfaceState {
    this.controller.stopContinuousAdaptation();
    return this.getState();
  }

  getLatestReport(): AdaptiveInterfaceRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopAdaptations() {
    return this.controller.getTopAdaptations();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  getActiveProfile() {
    return this.controller.getActiveProfile();
  }

  updateConfiguration(
    overrides: Partial<AdaptiveInterfaceConfiguration>,
  ): AdaptiveInterfaceState {
    const next = buildAdaptiveInterfaceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Adaptation cycles: ${state.performance.totalAdaptationCycles}`,
        `Adaptations: ${state.performance.totalAdaptations}`,
        `Continuous adaptation: ${state.health.continuousAdaptationActive ? "active" : "inactive"}`,
        report
          ? `Last adaptation: ${report.validation.decision}`
          : "No adaptation cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AdaptiveInterfaceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topAdaptations[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousAdaptationActive: state.health.continuousAdaptationActive,
      totalAdaptationCycles: state.performance.totalAdaptationCycles,
      totalAdaptations: state.performance.totalAdaptations,
      topPriorityCount: state.topAdaptations.filter(
        (r) => r.priority === "critical" || r.priority === "high",
      ).length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      currentWorkflowContext: top?.currentWorkflowContext ?? null,
      recentLogs: getAdaptiveLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createAdaptiveInterfaceEngine(
  bootstrap: EmpireBootstrapContext,
  workflowEvolution: WorkflowEvolutionEngine,
  productivityIntelligence: ProductivityIntelligenceEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  contextAwareness: ContextAwarenessEngine,
  interactionTracking: InteractionTrackingEngine,
  options?: AdaptiveInterfaceOptions,
): AdaptiveInterfaceEngine {
  return new AdaptiveInterfaceEngine(
    bootstrap,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    contextAwareness,
    interactionTracking,
    options,
  );
}

export function resetAdaptiveInterfaceForTesting(): void {
  resetAdaptiveLogsForTesting();
  new AdaptiveInterfaceManager().resetForTesting();
}
