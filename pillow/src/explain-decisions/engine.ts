import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import {
  appendExplanationLog,
  getExplanationLogs,
  resetExplanationLogsForTesting,
} from "./explanation-logging.js";
import { ExplainDecisionsController } from "./explain-decisions-controller.js";
import { ExplainDecisionsManager } from "./explain-decisions-manager.js";
import {
  buildExplainDecisionsConfiguration,
  type ExplainDecisionsConfiguration,
} from "./configuration.js";
import { EXPLAIN_DECISIONS_SYSTEM_PATH } from "./paths.js";
import type {
  ExplanationInput,
  ExplanationRunReport,
  ExplainDecisionsCockpitSnapshot,
  ExplainDecisionsState,
} from "./types.js";

export interface ExplainDecisionsOptions {
  configuration?: Partial<ExplainDecisionsConfiguration>;
}

/**
 * Explain Decisions (PILLOW-ED-001 / T4-06).
 * Explains design rationale behind UX proposals and comparisons.
 * Safety: explain only — never applies, approves, or modifies files.
 */
export class ExplainDecisionsEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExplainDecisionsController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    sideBySideComparison: SideBySideComparisonEngine,
    uxScoring: UxScoringEngine | null,
    recommendationEngine: RecommendationEngine | null,
    previewGenerator: PreviewGenerator | null,
    validationEngine: ValidationEngine | null,
    options: ExplainDecisionsOptions = {},
  ) {
    const config = buildExplainDecisionsConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ExplainDecisionsController(
      {
        multiProposalGenerator,
        sideBySideComparison,
        uxScoring,
        recommendationEngine,
        previewGenerator,
        validationEngine,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExplainDecisionsState> {
    const doc = await this.reader.readText(EXPLAIN_DECISIONS_SYSTEM_PATH);
    if (!doc?.includes("Explain Decisions")) {
      throw new Error(
        `${EXPLAIN_DECISIONS_SYSTEM_PATH} missing — Explain Decisions requires T4-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendExplanationLog({
      event: "explain_decisions_ready",
      level: "info",
      details: "Explain Decisions initialized",
    });
    return this.getState();
  }

  getState(): ExplainDecisionsState {
    if (!this.initializedAt) {
      throw new Error("Explain Decisions not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      explanationsCompleted: performance.totalExplanations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-ED-001",
      missionId: "T4-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  explain(input: ExplanationInput): ExplanationRunReport {
    return this.controller.explain(input);
  }

  getLatestReport(): ExplanationRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): ExplainDecisionsState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopExplainDecisions(): ExplainDecisionsState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ExplainDecisionsConfiguration>,
  ): ExplainDecisionsState {
    const next = buildExplainDecisionsConfiguration(this.bootstrap.repositoryRoot, {
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
        `Explanations completed: ${state.performance.totalExplanations}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.explanation.evidenceReferences.length} evidence refs`
          : "No explanations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExplainDecisionsCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastExplanationDecision,
      activeSessions: state.health.activeSessions,
      totalExplanations: state.performance.totalExplanations,
      evidenceLinked: state.performance.evidenceLinked,
      confidenceScore: Math.round((report?.explanation.confidenceScore ?? 0) * 100),
      weakEvidenceWarnings: state.performance.weakEvidenceWarnings,
      recentLogs: getExplanationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createExplainDecisions(
  bootstrap: EmpireBootstrapContext,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  sideBySideComparison: SideBySideComparisonEngine,
  uxScoring: UxScoringEngine | null,
  recommendationEngine: RecommendationEngine | null,
  previewGenerator: PreviewGenerator | null,
  validationEngine: ValidationEngine | null,
  options?: ExplainDecisionsOptions,
): ExplainDecisionsEngine {
  return new ExplainDecisionsEngine(
    bootstrap,
    multiProposalGenerator,
    sideBySideComparison,
    uxScoring,
    recommendationEngine,
    previewGenerator,
    validationEngine,
    options,
  );
}

export function resetExplainDecisionsForTesting(): void {
  resetExplanationLogsForTesting();
  new ExplainDecisionsManager().resetForTesting();
}
