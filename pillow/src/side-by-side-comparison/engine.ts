import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import {
  appendComparisonLog,
  getComparisonLogs,
  resetComparisonLogsForTesting,
} from "./comparison-logging.js";
import { SideBySideComparisonController } from "./side-by-side-comparison-controller.js";
import { SideBySideComparisonManager } from "./side-by-side-comparison-manager.js";
import {
  buildSideBySideComparisonConfiguration,
  type SideBySideComparisonConfiguration,
} from "./configuration.js";
import { SIDE_BY_SIDE_COMPARISON_SYSTEM_PATH } from "./paths.js";
import type {
  ComparisonInput,
  ComparisonRunReport,
  SideBySideComparisonCockpitSnapshot,
  SideBySideComparisonState,
} from "./types.js";

export interface SideBySideComparisonOptions {
  configuration?: Partial<SideBySideComparisonConfiguration>;
}

/**
 * Side-by-Side Comparison (PILLOW-SBC-001 / T4-05).
 * Compares redesign options visually for Grand King evaluation.
 * Safety: compare only — never applies, approves, or modifies files.
 */
export class SideBySideComparisonEngine {
  private initializedAt: string | null = null;
  private readonly controller: SideBySideComparisonController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    previewGenerator: PreviewGenerator | null,
    validationEngine: ValidationEngine | null,
    uxScoring: UxScoringEngine | null,
    uiStateMapper: UiStateMapperEngine | null,
    options: SideBySideComparisonOptions = {},
  ) {
    const config = buildSideBySideComparisonConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new SideBySideComparisonController(
      {
        multiProposalGenerator,
        previewGenerator,
        validationEngine,
        uxScoring,
        uiStateMapper,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SideBySideComparisonState> {
    const doc = await this.reader.readText(SIDE_BY_SIDE_COMPARISON_SYSTEM_PATH);
    if (!doc?.includes("Side-by-Side Comparison")) {
      throw new Error(
        `${SIDE_BY_SIDE_COMPARISON_SYSTEM_PATH} missing — Side-by-Side Comparison requires T4-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendComparisonLog({
      event: "side_by_side_comparison_ready",
      level: "info",
      details: "Side-by-Side Comparison initialized",
    });
    return this.getState();
  }

  getState(): SideBySideComparisonState {
    if (!this.initializedAt) {
      throw new Error("Side-by-Side Comparison not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      comparisonsCompleted: performance.totalComparisons,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-SBC-001",
      missionId: "T4-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  compare(input: ComparisonInput): ComparisonRunReport {
    return this.controller.compare(input);
  }

  getLatestReport(): ComparisonRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): SideBySideComparisonState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopSideBySideComparison(): SideBySideComparisonState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<SideBySideComparisonConfiguration>,
  ): SideBySideComparisonState {
    const next = buildSideBySideComparisonConfiguration(this.bootstrap.repositoryRoot, {
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
        `Comparisons completed: ${state.performance.totalComparisons}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.comparison.comparedOptions.length} options`
          : "No comparisons yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SideBySideComparisonCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastComparisonDecision,
      activeSessions: state.health.activeSessions,
      totalComparisons: state.performance.totalComparisons,
      optionsCompared: state.performance.totalOptionsCompared,
      differenceMarkers: report?.comparison.visualDifferenceMarkers.length ?? 0,
      confidenceScore: Math.round((report?.comparison.confidenceScore ?? 0) * 100),
      recentLogs: getComparisonLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createSideBySideComparison(
  bootstrap: EmpireBootstrapContext,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  previewGenerator: PreviewGenerator | null,
  validationEngine: ValidationEngine | null,
  uxScoring: UxScoringEngine | null,
  uiStateMapper: UiStateMapperEngine | null,
  options?: SideBySideComparisonOptions,
): SideBySideComparisonEngine {
  return new SideBySideComparisonEngine(
    bootstrap,
    multiProposalGenerator,
    previewGenerator,
    validationEngine,
    uxScoring,
    uiStateMapper,
    options,
  );
}

export function resetSideBySideComparisonForTesting(): void {
  resetComparisonLogsForTesting();
  new SideBySideComparisonManager().resetForTesting();
}
