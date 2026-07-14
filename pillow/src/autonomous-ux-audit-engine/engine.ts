import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import { AutonomousUxAuditController } from "./autonomous-ux-audit-controller.js";
import {
  buildAutonomousUxAuditConfiguration,
  type AutonomousUxAuditConfiguration,
} from "./configuration.js";
import { appendAuditLog, getAuditLogs, resetAuditLogsForTesting } from "./audit-logging.js";
import { AUTONOMOUS_UX_AUDIT_SYSTEM_PATH } from "./paths.js";
import { AutonomousUxAuditManager } from "./autonomous-ux-audit-manager.js";
import type {
  AutonomousUxAuditCockpitSnapshot,
  AutonomousUxAuditInput,
  AutonomousUxAuditRunReport,
  AutonomousUxAuditState,
} from "./types.js";

export interface AutonomousUxAuditOptions {
  configuration?: Partial<AutonomousUxAuditConfiguration>;
}

/**
 * Autonomous UX Audit Engine (PILLOW-AUA-001 / T5-02).
 * Proactive UX quality assurance for the EmpireAI interface.
 * Safety: audit only — never applies UX changes automatically.
 */
export class AutonomousUxAuditEngine {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousUxAuditController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    uxRuleEngine: UxRuleEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    accessibilityIntelligence: AccessibilityIntelligenceEngine,
    visualConsistency: VisualConsistencyEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    options: AutonomousUxAuditOptions = {},
  ) {
    const config = buildAutonomousUxAuditConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new AutonomousUxAuditController(
      {
        continuousScreenObservation,
        uxRuleEngine,
        designSystemIntelligence,
        accessibilityIntelligence,
        visualConsistency,
        layoutEvaluation,
        workflowOptimization,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousUxAuditState> {
    const doc = await this.reader.readText(AUTONOMOUS_UX_AUDIT_SYSTEM_PATH);
    if (!doc?.includes("Autonomous UX Audit")) {
      throw new Error(
        `${AUTONOMOUS_UX_AUDIT_SYSTEM_PATH} missing — Autonomous UX Audit requires T5-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAuditLog({
      event: "autonomous_ux_audit_ready",
      level: "info",
      details: "T5-02 Autonomous UX Audit initialized",
    });
    return this.getState();
  }

  getState(): AutonomousUxAuditState {
    if (!this.initializedAt) {
      throw new Error("Autonomous UX Audit not initialized. Call initialize() first.");
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
      continuousAuditActive: this.controller.isContinuousAuditActive(),
    });

    return {
      engineVersion: "PILLOW-AUA-001",
      missionId: "T5-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      latestAudit: this.controller.getLatestAudit(),
      health,
      performance,
    };
  }

  audit(input: AutonomousUxAuditInput = {}): AutonomousUxAuditRunReport {
    return this.controller.audit(input);
  }

  startContinuousAudit(): AutonomousUxAuditState {
    this.controller.startContinuousAudit();
    return this.getState();
  }

  stopContinuousAudit(): AutonomousUxAuditState {
    this.controller.stopContinuousAudit();
    return this.getState();
  }

  getLatestReport(): AutonomousUxAuditRunReport | null {
    return this.controller.getLatestReport();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  updateConfiguration(
    overrides: Partial<AutonomousUxAuditConfiguration>,
  ): AutonomousUxAuditState {
    const next = buildAutonomousUxAuditConfiguration(this.bootstrap.repositoryRoot, {
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
        `Audits: ${state.performance.totalAudits}`,
        `Issues detected: ${state.performance.totalIssuesDetected}`,
        `Continuous audit: ${state.health.continuousAuditActive ? "active" : "inactive"}`,
        report ? `Last audit: ${report.validation.decision}` : "No audit cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AutonomousUxAuditCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const audit = state.latestAudit;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousAuditActive: state.health.continuousAuditActive,
      totalAudits: state.performance.totalAudits,
      totalIssuesDetected: state.performance.totalIssuesDetected,
      layoutIssuesDetected: state.performance.layoutIssuesDetected,
      accessibilityIssuesDetected: state.performance.accessibilityIssuesDetected,
      confidenceScore: Math.round((audit?.confidenceScore ?? 0) * 100),
      recentLogs: getAuditLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAutonomousUxAuditEngine(
  bootstrap: EmpireBootstrapContext,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  uxRuleEngine: UxRuleEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  accessibilityIntelligence: AccessibilityIntelligenceEngine,
  visualConsistency: VisualConsistencyEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  options?: AutonomousUxAuditOptions,
): AutonomousUxAuditEngine {
  return new AutonomousUxAuditEngine(
    bootstrap,
    continuousScreenObservation,
    uxRuleEngine,
    designSystemIntelligence,
    accessibilityIntelligence,
    visualConsistency,
    layoutEvaluation,
    workflowOptimization,
    options,
  );
}

export function resetAutonomousUxAuditForTesting(): void {
  resetAuditLogsForTesting();
  new AutonomousUxAuditManager().resetForTesting();
}
