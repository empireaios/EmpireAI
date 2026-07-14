import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import {
  appendThemeLog,
  getThemeLogs,
  resetThemeLogsForTesting,
} from "./theme-logging.js";
import { GenerationController } from "./generation-controller.js";
import {
  buildThemeBuilderConfiguration,
  type ThemeBuilderConfiguration,
} from "./configuration.js";
import { THEME_BUILDER_SYSTEM_PATH } from "./paths.js";
import type {
  ThemeBuilderCockpitSnapshot,
  ThemeBuilderState,
  ThemeGenerationReport,
} from "./types.js";

export interface ThemeBuilderOptions {
  configuration?: Partial<ThemeBuilderConfiguration>;
}

/**
 * Theme Builder (PILLOW-TB-001 / T3-04).
 * Generates visual themes for EmpireAI from design system and UX intelligence.
 */
export class ThemeBuilder {
  private initializedAt: string | null = null;
  private readonly controller: GenerationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    recommendationEngine: RecommendationEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    options: ThemeBuilderOptions = {},
  ) {
    const config = buildThemeBuilderConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new GenerationController(
      {
        recommendationEngine,
        designSystemIntelligence,
        executiveStyleLearning,
        frontendBuilder,
        componentGenerator,
        layoutRefactoring,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ThemeBuilderState> {
    const doc = await this.reader.readText(THEME_BUILDER_SYSTEM_PATH);
    if (!doc?.includes("Theme Builder")) {
      throw new Error(
        `${THEME_BUILDER_SYSTEM_PATH} missing — Theme Builder requires T3-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendThemeLog({
      event: "theme_builder_ready",
      level: "info",
      details: "Theme Builder initialized",
    });
    return this.getState();
  }

  getState(): ThemeBuilderState {
    if (!this.initializedAt) {
      throw new Error("Theme Builder not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      generationsCompleted: performance.totalGenerations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-TB-001",
      missionId: "T3-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generateThemes(): ThemeGenerationReport {
    return this.controller.generateThemes();
  }

  getLatestReport(): ThemeGenerationReport | null {
    return this.controller.getLatestReport();
  }

  stopThemeBuilder(): ThemeBuilderState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ThemeBuilderConfiguration>,
  ): ThemeBuilderState {
    const next = buildThemeBuilderConfiguration(this.bootstrap.repositoryRoot, {
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
        `Generations completed: ${state.performance.totalGenerations}`,
        report
          ? `Last generation: ${report.validation.decision} · ${report.records.length} themes`
          : "No themes generated yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ThemeBuilderCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      themesCount: report?.records.length ?? 0,
      validatedCount:
        report?.records.filter((r) => r.themeStatus === "validated").length ?? 0,
      blockedCount: report?.records.filter((r) => r.themeStatus === "blocked").length ?? 0,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              report.records.reduce((s, r) => s + r.confidenceScore, 0) / report.records.length,
            )
          : 0,
      totalGenerations: state.performance.totalGenerations,
      recentLogs: getThemeLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createThemeBuilder(
  bootstrap: EmpireBootstrapContext,
  recommendationEngine: RecommendationEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  options?: ThemeBuilderOptions,
): ThemeBuilder {
  return new ThemeBuilder(
    bootstrap,
    recommendationEngine,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    options,
  );
}

export function resetThemeBuilderForTesting(): void {
  resetThemeLogsForTesting();
}
