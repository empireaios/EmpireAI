import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RollbackManagerEngine } from "../rollback-manager/engine.js";
import type { RegressionProtectionEngine } from "../regression-protection/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import {
  appendChangeDocumentationLog,
  getChangeDocumentationLogs,
  resetChangeDocumentationLogsForTesting,
} from "./change-documentation-logging.js";
import { ChangeDocumentationController } from "./change-documentation-controller.js";
import { ChangeDocumentationManager } from "./change-documentation-manager.js";
import {
  buildChangeDocumentationConfiguration,
  type ChangeDocumentationConfiguration,
} from "./configuration.js";
import { CHANGE_DOCUMENTATION_SYSTEM_PATH } from "./paths.js";
import type {
  ChangeDocumentationCockpitSnapshot,
  ChangeDocumentationState,
  ChangeDocumentationRunReport,
} from "./types.js";

export interface ChangeDocumentationOptions {
  configuration?: Partial<ChangeDocumentationConfiguration>;
}

/**
 * Change Documentation (PILLOW-CD-001 / T3-09).
 * Documents and explains EmpireAI frontend modifications transparently.
 */
export class ChangeDocumentationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ChangeDocumentationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    rollbackManager: RollbackManagerEngine,
    regressionProtection: RegressionProtectionEngine,
    validationEngine: ValidationEngine,
    previewGenerator: PreviewGenerator,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    themeBuilder: ThemeBuilder,
    options: ChangeDocumentationOptions = {},
  ) {
    const config = buildChangeDocumentationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ChangeDocumentationController(
      {
        rollbackManager,
        regressionProtection,
        validationEngine,
        previewGenerator,
        frontendBuilder,
        componentGenerator,
        layoutRefactoring,
        themeBuilder,
      },
      config,
      bootstrap.repositoryRoot,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ChangeDocumentationState> {
    const doc = await this.reader.readText(CHANGE_DOCUMENTATION_SYSTEM_PATH);
    if (!doc?.includes("Change Documentation")) {
      throw new Error(
        `${CHANGE_DOCUMENTATION_SYSTEM_PATH} missing — Change Documentation requires T3-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendChangeDocumentationLog({
      event: "change_documentation_ready",
      level: "info",
      details: "Change Documentation initialized",
    });
    return this.getState();
  }

  getState(): ChangeDocumentationState {
    if (!this.initializedAt) {
      throw new Error("Change Documentation not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      documentationsCompleted: performance.totalDocumentations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CD-001",
      missionId: "T3-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  documentChanges(): ChangeDocumentationRunReport {
    return this.controller.documentChanges();
  }

  getLatestReport(): ChangeDocumentationRunReport | null {
    return this.controller.getLatestReport();
  }

  stopChangeDocumentation(): ChangeDocumentationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ChangeDocumentationConfiguration>,
  ): ChangeDocumentationState {
    const next = buildChangeDocumentationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Documentations completed: ${state.performance.totalDocumentations}`,
        report
          ? `Last documentation: ${report.validation.decision} · ${report.records.length} records`
          : "No documentation runs yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ChangeDocumentationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    const acceptedCount =
      report?.records.filter((r) => r.finalChangeStatus === "accepted").length ?? 0;
    const rejectedCount =
      report?.records.filter((r) => r.finalChangeStatus === "rejected").length ?? 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastDocumentationDecision,
      recordsCount: report?.records.length ?? 0,
      acceptedCount,
      rejectedCount,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              (report.records.filter((r) => r.finalChangeStatus !== "failed").length /
                report.records.length) *
                100,
            )
          : 0,
      totalDocumentations: state.performance.totalDocumentations,
      recentLogs: getChangeDocumentationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createChangeDocumentation(
  bootstrap: EmpireBootstrapContext,
  rollbackManager: RollbackManagerEngine,
  regressionProtection: RegressionProtectionEngine,
  validationEngine: ValidationEngine,
  previewGenerator: PreviewGenerator,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  themeBuilder: ThemeBuilder,
  options?: ChangeDocumentationOptions,
): ChangeDocumentationEngine {
  return new ChangeDocumentationEngine(
    bootstrap,
    rollbackManager,
    regressionProtection,
    validationEngine,
    previewGenerator,
    frontendBuilder,
    componentGenerator,
    layoutRefactoring,
    themeBuilder,
    options,
  );
}

export function resetChangeDocumentationForTesting(): void {
  resetChangeDocumentationLogsForTesting();
  new ChangeDocumentationManager().resetForTesting();
}
