import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { ContinuousCollaborationEngine } from "../continuous-collaboration/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import {
  buildUxOpportunityDiscoveryConfiguration,
  type UxOpportunityDiscoveryConfiguration,
} from "./configuration.js";
import {
  appendDiscoveryLog,
  getDiscoveryLogs,
  resetDiscoveryLogsForTesting,
} from "./opportunity-logging.js";
import { UX_OPPORTUNITY_DISCOVERY_SYSTEM_PATH } from "./paths.js";
import type {
  OpportunityDiscoveryRunReport,
  UxOpportunityDiscoveryCockpitSnapshot,
  UxOpportunityDiscoveryInput,
  UxOpportunityDiscoveryState,
} from "./types.js";
import { UxOpportunityDiscoveryController } from "./ux-opportunity-discovery-controller.js";
import { UxOpportunityDiscoveryManager } from "./ux-opportunity-discovery-manager.js";

export interface UxOpportunityDiscoveryOptions {
  configuration?: Partial<UxOpportunityDiscoveryConfiguration>;
}

/**
 * UX Opportunity Discovery Engine (PILLOW-UOD-001 / T5-03).
 * Continuous discovery of UX improvement opportunities.
 * Safety: discover only — never applies UX changes automatically.
 */
export class UxOpportunityDiscoveryEngine {
  private initializedAt: string | null = null;
  private readonly controller: UxOpportunityDiscoveryController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    uxScoring: UxScoringEngine,
    recommendationEngine: RecommendationEngine,
    continuousCollaboration: ContinuousCollaborationEngine,
    uxRuleEngine: UxRuleEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    accessibilityIntelligence: AccessibilityIntelligenceEngine,
    visualConsistency: VisualConsistencyEngine,
    options: UxOpportunityDiscoveryOptions = {},
  ) {
    const config = buildUxOpportunityDiscoveryConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new UxOpportunityDiscoveryController(
      {
        autonomousUxAudit,
        continuousScreenObservation,
        uxScoring,
        recommendationEngine,
        continuousCollaboration,
        uxRuleEngine,
        designSystemIntelligence,
        accessibilityIntelligence,
        visualConsistency,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<UxOpportunityDiscoveryState> {
    const doc = await this.reader.readText(UX_OPPORTUNITY_DISCOVERY_SYSTEM_PATH);
    if (!doc?.includes("UX Opportunity Discovery")) {
      throw new Error(
        `${UX_OPPORTUNITY_DISCOVERY_SYSTEM_PATH} missing — UX Opportunity Discovery requires T5-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendDiscoveryLog({
      event: "ux_opportunity_discovery_ready",
      level: "info",
      details: "T5-03 UX Opportunity Discovery initialized",
    });
    return this.getState();
  }

  getState(): UxOpportunityDiscoveryState {
    if (!this.initializedAt) {
      throw new Error("UX Opportunity Discovery not initialized. Call initialize() first.");
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
      continuousDiscoveryActive: this.controller.isContinuousDiscoveryActive(),
    });

    return {
      engineVersion: "PILLOW-UOD-001",
      missionId: "T5-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      topOpportunities: this.controller.getTopOpportunities(),
      health,
      performance,
    };
  }

  discover(input: UxOpportunityDiscoveryInput = {}): OpportunityDiscoveryRunReport {
    return this.controller.discover(input);
  }

  startContinuousDiscovery(): UxOpportunityDiscoveryState {
    this.controller.startContinuousDiscovery();
    return this.getState();
  }

  stopContinuousDiscovery(): UxOpportunityDiscoveryState {
    this.controller.stopContinuousDiscovery();
    return this.getState();
  }

  getLatestReport(): OpportunityDiscoveryRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopOpportunities() {
    return this.controller.getTopOpportunities();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<UxOpportunityDiscoveryConfiguration>,
  ): UxOpportunityDiscoveryState {
    const next = buildUxOpportunityDiscoveryConfiguration(this.bootstrap.repositoryRoot, {
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
        `Discoveries: ${state.performance.totalDiscoveries}`,
        `Opportunities: ${state.performance.totalOpportunitiesDiscovered}`,
        `Continuous discovery: ${state.health.continuousDiscoveryActive ? "active" : "inactive"}`,
        report
          ? `Last discovery: ${report.validation.decision}`
          : "No discovery cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): UxOpportunityDiscoveryCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topOpportunities[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousDiscoveryActive: state.health.continuousDiscoveryActive,
      totalDiscoveries: state.performance.totalDiscoveries,
      totalOpportunitiesDiscovered: state.performance.totalOpportunitiesDiscovered,
      topPriorityCount: state.topOpportunities.filter(
        (o) => o.priority === "critical" || o.priority === "high",
      ).length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      recentLogs: getDiscoveryLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createUxOpportunityDiscoveryEngine(
  bootstrap: EmpireBootstrapContext,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  uxScoring: UxScoringEngine,
  recommendationEngine: RecommendationEngine,
  continuousCollaboration: ContinuousCollaborationEngine,
  uxRuleEngine: UxRuleEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  accessibilityIntelligence: AccessibilityIntelligenceEngine,
  visualConsistency: VisualConsistencyEngine,
  options?: UxOpportunityDiscoveryOptions,
): UxOpportunityDiscoveryEngine {
  return new UxOpportunityDiscoveryEngine(
    bootstrap,
    autonomousUxAudit,
    continuousScreenObservation,
    uxScoring,
    recommendationEngine,
    continuousCollaboration,
    uxRuleEngine,
    designSystemIntelligence,
    accessibilityIntelligence,
    visualConsistency,
    options,
  );
}

export function resetUxOpportunityDiscoveryForTesting(): void {
  resetDiscoveryLogsForTesting();
  new UxOpportunityDiscoveryManager().resetForTesting();
}
