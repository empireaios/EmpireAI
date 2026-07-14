import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import {
  appendValidationLog,
  getValidationLogs,
  resetValidationLogsForTesting,
} from "./validation-logging.js";
import { ValidationController } from "./validation-controller.js";
import {
  buildValidationEngineConfiguration,
  type ValidationEngineConfiguration,
} from "./configuration.js";
import { VALIDATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ValidationEngineCockpitSnapshot,
  ValidationEngineState,
  ValidationRunReport,
} from "./types.js";

export interface ValidationEngineOptions {
  configuration?: Partial<ValidationEngineConfiguration>;
}

/**
 * Validation Engine (PILLOW-VE-001 / T3-06).
 * Detects UI defects in preview builds before changes advance.
 */
export class ValidationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ValidationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    previewGenerator: PreviewGenerator,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    themeBuilder: ThemeBuilder,
    options: ValidationEngineOptions = {},
  ) {
    const config = buildValidationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ValidationController(
      {
        previewGenerator,
        frontendBuilder,
        componentGenerator,
        layoutRefactoring,
        themeBuilder,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ValidationEngineState> {
    const doc = await this.reader.readText(VALIDATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Validation Engine")) {
      throw new Error(
        `${VALIDATION_ENGINE_SYSTEM_PATH} missing — Validation Engine requires T3-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendValidationLog({
      event: "validation_engine_ready",
      level: "info",
      details: "Validation Engine initialized",
    });
    return this.getState();
  }

  getState(): ValidationEngineState {
    if (!this.initializedAt) {
      throw new Error("Validation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      validationsCompleted: performance.totalValidations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-VE-001",
      missionId: "T3-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  validateUi(): ValidationRunReport {
    return this.controller.validateUi();
  }

  getLatestReport(): ValidationRunReport | null {
    return this.controller.getLatestReport();
  }

  isSafeToAdvance(): boolean {
    const report = this.controller.getLatestReport();
    if (!report) return false;
    return report.validation.decision === "pass" || report.validation.decision === "partial";
  }

  stopValidationEngine(): ValidationEngineState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ValidationEngineConfiguration>,
  ): ValidationEngineState {
    const next = buildValidationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Validations completed: ${state.performance.totalValidations}`,
        report
          ? `Last validation: ${report.validation.decision} · ${report.validation.defectsDetected} defects`
          : "No validations run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ValidationEngineCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      reportsCount: report?.reports.length ?? 0,
      defectsCount: report?.validation.defectsDetected ?? 0,
      blockedCount: state.performance.blockedChanges,
      confidenceScore:
        report && report.reports.length > 0
          ? Math.round(
              report.reports.reduce((s, r) => s + r.confidenceScore, 0) /
                report.reports.length,
            )
          : 0,
      totalValidations: state.performance.totalValidations,
      recentLogs: getValidationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createValidationEngine(
  bootstrap: EmpireBootstrapContext,
  previewGenerator: PreviewGenerator,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  themeBuilder: ThemeBuilder,
  options?: ValidationEngineOptions,
): ValidationEngine {
  return new ValidationEngine(
    bootstrap,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    options,
  );
}

export function resetValidationEngineForTesting(): void {
  resetValidationLogsForTesting();
}
