import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import {
  appendPreviewLog,
  getPreviewLogs,
  resetPreviewLogsForTesting,
} from "./preview-logging.js";
import { resetPreviewEnvironmentsForTesting } from "./preview-environment-manager.js";
import { GenerationController } from "./generation-controller.js";
import {
  buildPreviewGeneratorConfiguration,
  type PreviewGeneratorConfiguration,
} from "./configuration.js";
import { PREVIEW_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  PreviewGeneratorCockpitSnapshot,
  PreviewGeneratorState,
  PreviewGenerationReport,
} from "./types.js";

export interface PreviewGeneratorOptions {
  configuration?: Partial<PreviewGeneratorConfiguration>;
}

/**
 * Preview Generator (PILLOW-PG-001 / T3-05).
 * Generates instant isolated preview builds for immediate UX review.
 */
export class PreviewGenerator {
  private initializedAt: string | null = null;
  private readonly controller: GenerationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    themeBuilder: ThemeBuilder,
    options: PreviewGeneratorOptions = {},
  ) {
    const config = buildPreviewGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new GenerationController(
      {
        frontendBuilder,
        componentGenerator,
        layoutRefactoring,
        themeBuilder,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PreviewGeneratorState> {
    const doc = await this.reader.readText(PREVIEW_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("Preview Generator")) {
      throw new Error(
        `${PREVIEW_GENERATOR_SYSTEM_PATH} missing — Preview Generator requires T3-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPreviewLog({
      event: "preview_generator_ready",
      level: "info",
      details: "Preview Generator initialized",
    });
    return this.getState();
  }

  getState(): PreviewGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Preview Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      previewsCompleted: performance.totalPreviews,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeEnvironments: this.controller.getActiveEnvironmentCount(),
    });

    return {
      engineVersion: "PILLOW-PG-001",
      missionId: "T3-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  generatePreviews(): PreviewGenerationReport {
    return this.controller.generatePreviews();
  }

  getLatestReport(): PreviewGenerationReport | null {
    return this.controller.getLatestReport();
  }

  cleanupPreviews(): number {
    return this.controller.cleanupPreviews();
  }

  stopPreviewGenerator(): PreviewGeneratorState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<PreviewGeneratorConfiguration>,
  ): PreviewGeneratorState {
    const next = buildPreviewGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Previews completed: ${state.performance.totalPreviews}`,
        report
          ? `Last preview: ${report.validation.decision} · ${report.records.length} builds`
          : "No previews generated yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PreviewGeneratorCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      previewsCount: report?.records.length ?? 0,
      validatedCount:
        report?.records.filter((r) => r.buildStatus === "validated").length ?? 0,
      blockedCount: report?.records.filter((r) => r.buildStatus === "blocked").length ?? 0,
      activeEnvironments: state.health.activeEnvironments,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              report.records.reduce((s, r) => s + r.confidenceScore, 0) / report.records.length,
            )
          : 0,
      totalPreviews: state.performance.totalPreviews,
      recentLogs: getPreviewLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createPreviewGenerator(
  bootstrap: EmpireBootstrapContext,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  themeBuilder: ThemeBuilder,
  options?: PreviewGeneratorOptions,
): PreviewGenerator {
  return new PreviewGenerator(
    bootstrap,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    options,
  );
}

export function resetPreviewGeneratorForTesting(): void {
  resetPreviewLogsForTesting();
  resetPreviewEnvironmentsForTesting();
}
