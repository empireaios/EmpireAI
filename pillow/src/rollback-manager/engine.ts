import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { RegressionProtectionEngine } from "../regression-protection/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import {
  appendRollbackLog,
  getRollbackLogs,
  resetRollbackLogsForTesting,
} from "./rollback-logging.js";
import { RollbackController } from "./rollback-controller.js";
import { RollbackManagerManager } from "./rollback-manager-manager.js";
import {
  buildRollbackManagerConfiguration,
  type RollbackManagerConfiguration,
} from "./configuration.js";
import { ROLLBACK_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  RollbackManagerCockpitSnapshot,
  RollbackManagerState,
  RollbackRunReport,
  RollbackTrigger,
} from "./types.js";
import type { RestorePoint } from "./types.js";

export interface RollbackManagerOptions {
  configuration?: Partial<RollbackManagerConfiguration>;
}

/**
 * Rollback Manager (PILLOW-RM-001 / T3-08).
 * Safely recovers from failed, unsafe, or rejected frontend changes.
 */
export class RollbackManagerEngine {
  private initializedAt: string | null = null;
  private readonly controller: RollbackController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    regressionProtection: RegressionProtectionEngine,
    validationEngine: ValidationEngine,
    previewGenerator: PreviewGenerator,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutRefactoring: LayoutRefactoringEngine,
    themeBuilder: ThemeBuilder,
    options: RollbackManagerOptions = {},
  ) {
    const config = buildRollbackManagerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new RollbackController(
      {
        regressionProtection,
        validationEngine,
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

  async initialize(): Promise<RollbackManagerState> {
    const doc = await this.reader.readText(ROLLBACK_MANAGER_SYSTEM_PATH);
    if (!doc?.includes("Rollback Manager")) {
      throw new Error(
        `${ROLLBACK_MANAGER_SYSTEM_PATH} missing — Rollback Manager requires T3-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRollbackLog({
      event: "rollback_manager_ready",
      level: "info",
      details: "Rollback Manager initialized",
    });
    return this.getState();
  }

  getState(): RollbackManagerState {
    if (!this.initializedAt) {
      throw new Error("Rollback Manager not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      rollbacksCompleted: performance.totalRollbacks,
      restorePointsActive: performance.restorePointsCreated,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RM-001",
      missionId: "T3-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  createRestorePoint(): RestorePoint {
    return this.controller.createRestorePoint();
  }

  executeRollback(trigger?: RollbackTrigger): RollbackRunReport {
    return this.controller.executeRollback(trigger);
  }

  getLatestReport(): RollbackRunReport | null {
    return this.controller.getLatestReport();
  }

  isRollbackVerified(): boolean {
    const report = this.controller.getLatestReport();
    if (!report || report.reports.length === 0) return false;
    return report.reports.every((r) => r.rollbackVerificationResult.verified);
  }

  stopRollbackManager(): RollbackManagerState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<RollbackManagerConfiguration>,
  ): RollbackManagerState {
    const next = buildRollbackManagerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Rollbacks completed: ${state.performance.totalRollbacks}`,
        report
          ? `Last rollback: ${report.validation.decision} · ${report.reports.length} executed`
          : "No rollbacks executed yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RollbackManagerCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastRollbackDecision,
      rollbacksCount: report?.reports.length ?? 0,
      restorePointsCount: report?.restorePoints.length ?? 0,
      verifiedCount: state.performance.verifiedRollbacks,
      confidenceScore:
        report && report.reports.length > 0
          ? Math.round(
              report.reports.reduce((s, r) => s + r.confidenceScore, 0) / report.reports.length,
            )
          : 0,
      totalRollbacks: state.performance.totalRollbacks,
      recentLogs: getRollbackLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createRollbackManager(
  bootstrap: EmpireBootstrapContext,
  regressionProtection: RegressionProtectionEngine,
  validationEngine: ValidationEngine,
  previewGenerator: PreviewGenerator,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutRefactoring: LayoutRefactoringEngine,
  themeBuilder: ThemeBuilder,
  options?: RollbackManagerOptions,
): RollbackManagerEngine {
  return new RollbackManagerEngine(
    bootstrap,
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

export function resetRollbackManagerForTesting(): void {
  resetRollbackLogsForTesting();
  new RollbackManagerManager().resetForTesting();
}
