import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { VisualFoundationCertificationEngine } from "../visual-foundation-certification-engine/engine.js";
import {
  appendRegressionLog,
  getRegressionLogs,
  resetRegressionLogsForTesting,
} from "./regression-logging.js";
import { RegressionController } from "./regression-controller.js";
import { RegressionProtectionManager } from "./regression-protection-manager.js";
import {
  buildRegressionProtectionConfiguration,
  type RegressionProtectionConfiguration,
} from "./configuration.js";
import { REGRESSION_PROTECTION_SYSTEM_PATH } from "./paths.js";
import type {
  RegressionProtectionCockpitSnapshot,
  RegressionProtectionState,
  RegressionRunReport,
} from "./types.js";

export interface RegressionProtectionOptions {
  configuration?: Partial<RegressionProtectionConfiguration>;
}

/**
 * Regression Protection (PILLOW-RP-001 / T3-07).
 * Prevents UX regressions when UI changes are generated, previewed and validated.
 */
export class RegressionProtectionEngine {
  private initializedAt: string | null = null;
  private readonly controller: RegressionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    validationEngine: ValidationEngine,
    previewGenerator: PreviewGenerator,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    uxScoring: UxScoringEngine,
    recommendationEngine: RecommendationEngine,
    layoutUnderstanding: LayoutUnderstandingEngine,
    navigationMapping: NavigationMappingEngine,
    visualFoundationCertification: VisualFoundationCertificationEngine,
    options: RegressionProtectionOptions = {},
  ) {
    const config = buildRegressionProtectionConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new RegressionController(
      {
        validationEngine,
        previewGenerator,
        frontendBuilder,
        componentGenerator,
        uxScoring,
        recommendationEngine,
        layoutUnderstanding,
        navigationMapping,
        visualFoundationCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RegressionProtectionState> {
    const doc = await this.reader.readText(REGRESSION_PROTECTION_SYSTEM_PATH);
    if (!doc?.includes("Regression Protection")) {
      throw new Error(
        `${REGRESSION_PROTECTION_SYSTEM_PATH} missing — Regression Protection requires T3-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRegressionLog({
      event: "regression_protection_ready",
      level: "info",
      details: "Regression Protection initialized",
    });
    return this.getState();
  }

  getState(): RegressionProtectionState {
    if (!this.initializedAt) {
      throw new Error("Regression Protection not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      checksCompleted: performance.totalChecks,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RP-001",
      missionId: "T3-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  checkRegressions(): RegressionRunReport {
    return this.controller.checkRegressions();
  }

  getLatestReport(): RegressionRunReport | null {
    return this.controller.getLatestReport();
  }

  isStableImprovement(): boolean {
    const report = this.controller.getLatestReport();
    if (!report) return false;
    return report.validation.decision === "pass" || report.validation.decision === "partial";
  }

  stopRegressionProtection(): RegressionProtectionState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<RegressionProtectionConfiguration>,
  ): RegressionProtectionState {
    const next = buildRegressionProtectionConfiguration(this.bootstrap.repositoryRoot, {
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
          : report.validation.decision === "blocked"
            ? 20
            : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed" && report?.validation.decision !== "blocked",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Checks completed: ${state.performance.totalChecks}`,
        report
          ? `Last check: ${report.validation.decision} · ${report.validation.regressionsDetected} regressions`
          : "No regression checks run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RegressionProtectionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastProtectionDecision,
      reportsCount: report?.reports.length ?? 0,
      regressionsCount: report?.validation.regressionsDetected ?? 0,
      blockedCount: state.performance.blockedChanges,
      confidenceScore:
        report && report.reports.length > 0
          ? Math.round(
              report.reports.reduce((s, r) => s + r.confidenceScore, 0) / report.reports.length,
            )
          : 0,
      totalChecks: state.performance.totalChecks,
      recentLogs: getRegressionLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createRegressionProtectionEngine(
  bootstrap: EmpireBootstrapContext,
  validationEngine: ValidationEngine,
  previewGenerator: PreviewGenerator,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  uxScoring: UxScoringEngine,
  recommendationEngine: RecommendationEngine,
  layoutUnderstanding: LayoutUnderstandingEngine,
  navigationMapping: NavigationMappingEngine,
  visualFoundationCertification: VisualFoundationCertificationEngine,
  options?: RegressionProtectionOptions,
): RegressionProtectionEngine {
  return new RegressionProtectionEngine(
    bootstrap,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    uxScoring,
    recommendationEngine,
    layoutUnderstanding,
    navigationMapping,
    visualFoundationCertification,
    options,
  );
}

export function resetRegressionProtectionForTesting(): void {
  resetRegressionLogsForTesting();
  new RegressionProtectionManager().resetForTesting();
}
