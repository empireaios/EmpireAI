import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ExecutiveWorkspaceIntelligenceEngine } from "../executive-workspace-intelligence-engine/engine.js";
import type { ContinuousUxEvolutionEngine } from "../continuous-ux-evolution-engine/engine.js";
import type { AdaptiveInterfaceEngine } from "../adaptive-interface-engine/engine.js";
import type { WorkflowEvolutionEngine } from "../workflow-evolution-engine/engine.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { ChangeDocumentationEngine } from "../change-documentation/engine.js";
import {
  buildSelfImprovingUxConfiguration,
  type SelfImprovingUxConfiguration,
} from "./configuration.js";
import {
  appendLearningLog,
  getLearningLogs,
  resetLearningLogsForTesting,
} from "./siux-logging.js";
import { SELF_IMPROVING_UX_SYSTEM_PATH } from "./paths.js";
import type {
  SelfImprovingUxCockpitSnapshot,
  SelfImprovingUxInput,
  SelfImprovingUxRunReport,
  SelfImprovingUxState,
} from "./types.js";
import { SelfImprovingUxController } from "./self-improving-ux-controller.js";
import { SelfImprovingUxManager } from "./self-improving-ux-manager.js";

export interface SelfImprovingUxOptions {
  configuration?: Partial<SelfImprovingUxConfiguration>;
}

/**
 * Self-Improving UX Engine (PILLOW-SIUX-001 / T5-09).
 * Continuous UX learning from redesigns, approvals, and outcomes.
 * Safety: learn only — never applies or approves UX changes automatically.
 */
export class SelfImprovingUxEngine {
  private initializedAt: string | null = null;
  private readonly controller: SelfImprovingUxController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    executiveWorkspaceIntelligence: ExecutiveWorkspaceIntelligenceEngine,
    continuousUxEvolution: ContinuousUxEvolutionEngine,
    adaptiveInterface: AdaptiveInterfaceEngine,
    workflowEvolution: WorkflowEvolutionEngine,
    productivityIntelligence: ProductivityIntelligenceEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    approvalWorkflow: ApprovalWorkflowEngine,
    changeDocumentation: ChangeDocumentationEngine,
    options: SelfImprovingUxOptions = {},
  ) {
    const config = buildSelfImprovingUxConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new SelfImprovingUxController(
      {
        executiveWorkspaceIntelligence,
        continuousUxEvolution,
        adaptiveInterface,
        workflowEvolution,
        productivityIntelligence,
        uxOpportunityDiscovery,
        autonomousUxAudit,
        continuousScreenObservation,
        approvalWorkflow,
        changeDocumentation,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SelfImprovingUxState> {
    const doc = await this.reader.readText(SELF_IMPROVING_UX_SYSTEM_PATH);
    if (!doc?.includes("Self-Improving UX")) {
      throw new Error(
        `${SELF_IMPROVING_UX_SYSTEM_PATH} missing — Self-Improving UX requires T5-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLearningLog({
      event: "self_improving_ux_ready",
      level: "info",
      details: "T5-09 Self-Improving UX Engine initialized",
    });
    return this.getState();
  }

  getState(): SelfImprovingUxState {
    if (!this.initializedAt) {
      throw new Error("Self-Improving UX Engine not initialized. Call initialize() first.");
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
      knowledgeBaseSize: this.controller.getManager().getKnowledgeBase().getSize(),
    });

    return {
      engineVersion: "PILLOW-SIUX-001",
      missionId: "T5-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      knowledgeBase: this.controller.getKnowledgeBase(),
      topLearnings: this.controller.getTopLearnings(),
      health,
      performance,
    };
  }

  learnUx(input: SelfImprovingUxInput = {}): SelfImprovingUxRunReport {
    return this.controller.learnUx(input);
  }

  startContinuousLearning(): SelfImprovingUxState {
    this.controller.startContinuousLearning();
    return this.getState();
  }

  stopContinuousLearning(): SelfImprovingUxState {
    this.controller.stopContinuousLearning();
    return this.getState();
  }

  getLatestReport(): SelfImprovingUxRunReport | null {
    return this.controller.getLatestReport();
  }

  getTopLearnings() {
    return this.controller.getTopLearnings();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  getKnowledgeBase() {
    return this.controller.getKnowledgeBase();
  }

  updateConfiguration(
    overrides: Partial<SelfImprovingUxConfiguration>,
  ): SelfImprovingUxState {
    const next = buildSelfImprovingUxConfiguration(this.bootstrap.repositoryRoot, {
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
        `Insights: ${state.performance.totalInsights}`,
        `Knowledge base: ${state.knowledgeBase.length} entries`,
        `Continuous learning: ${state.health.continuousLearningActive ? "active" : "inactive"}`,
        report
          ? `Last learning: ${report.validation.decision}`
          : "No learning cycles yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SelfImprovingUxCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.topLearnings[0];

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? null,
      continuousLearningActive: state.health.continuousLearningActive,
      totalLearningCycles: state.performance.totalLearningCycles,
      totalInsights: state.performance.totalInsights,
      knowledgeBaseSize: state.knowledgeBase.length,
      confidenceScore: Math.round((top?.confidenceScore ?? 0) * 100),
      dominantLearningCategory: top?.learningCategory ?? null,
      recentLogs: getLearningLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createSelfImprovingUxEngine(
  bootstrap: EmpireBootstrapContext,
  executiveWorkspaceIntelligence: ExecutiveWorkspaceIntelligenceEngine,
  continuousUxEvolution: ContinuousUxEvolutionEngine,
  adaptiveInterface: AdaptiveInterfaceEngine,
  workflowEvolution: WorkflowEvolutionEngine,
  productivityIntelligence: ProductivityIntelligenceEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  approvalWorkflow: ApprovalWorkflowEngine,
  changeDocumentation: ChangeDocumentationEngine,
  options?: SelfImprovingUxOptions,
): SelfImprovingUxEngine {
  return new SelfImprovingUxEngine(
    bootstrap,
    executiveWorkspaceIntelligence,
    continuousUxEvolution,
    adaptiveInterface,
    workflowEvolution,
    productivityIntelligence,
    uxOpportunityDiscovery,
    autonomousUxAudit,
    continuousScreenObservation,
    approvalWorkflow,
    changeDocumentation,
    options,
  );
}

export function resetSelfImprovingUxForTesting(): void {
  resetLearningLogsForTesting();
  new SelfImprovingUxManager().resetForTesting();
}
