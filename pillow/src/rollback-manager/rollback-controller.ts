/** T3-08 — Rollback Manager orchestration controller. */

import type { RegressionProtectionEngine } from "../regression-protection/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import { appendRollbackLog } from "./rollback-logging.js";
import { RollbackManagerManager } from "./rollback-manager-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  RollbackManagerPerformanceStats,
  RollbackRunReport,
  RollbackTrigger,
} from "./types.js";
import type { RestorePoint } from "./types.js";

export type RollbackManagerEngineBundle = {
  regressionProtection: RegressionProtectionEngine;
  validationEngine: ValidationEngine;
  previewGenerator: PreviewGenerator;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutRefactoring: LayoutRefactoringEngine;
  themeBuilder: ThemeBuilder;
};

export class RollbackController {
  private config: RollbackManagerConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RollbackRunReport | null = null;
  private readonly manager = new RollbackManagerManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RollbackManagerPerformanceStats = {
    totalRollbacks: 0,
    successfulRollbacks: 0,
    failedRollbacks: 0,
    restorePointsCreated: 0,
    verifiedRollbacks: 0,
    averageRollbackDurationMs: 0,
    peakRollbackDurationMs: 0,
  };

  constructor(
    private readonly engines: RollbackManagerEngineBundle,
    config: RollbackManagerConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendRollbackLog({
      event: "rollback_manager_initialized",
      level: "info",
      details: "Rollback Manager started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendRollbackLog({
      event: "rollback_manager_stop",
      level: "info",
      details: "Rollback Manager stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RollbackManagerConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RollbackManagerConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RollbackRunReport | null {
    return this.latestReport;
  }

  getPerformance(): RollbackManagerPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  private collectUpstream() {
    let regressionReport = this.engines.regressionProtection.getLatestReport();
    let validationReport = this.engines.validationEngine.getLatestReport();
    let previewGeneration = this.engines.previewGenerator.getLatestReport();
    let frontendBuild = this.engines.frontendBuilder.getLatestReport();
    let componentGeneration = this.engines.componentGenerator.getLatestReport();
    let layoutRefactoring = this.engines.layoutRefactoring.getLatestReport();
    let themeGeneration = this.engines.themeBuilder.getLatestReport();

    if (!regressionReport) {
      appendRollbackLog({ event: "partial_rollback_input", level: "warn", details: "No regression report" });
      regressionReport = this.engines.regressionProtection.checkRegressions();
    }
    if (!validationReport) {
      appendRollbackLog({ event: "partial_rollback_input", level: "warn", details: "No validation report" });
      validationReport = this.engines.validationEngine.validateUi();
    }
    if (!previewGeneration) {
      previewGeneration = this.engines.previewGenerator.generatePreviews();
    }
    if (!frontendBuild) {
      frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
    }
    if (!componentGeneration) {
      componentGeneration = this.engines.componentGenerator.generateComponents();
    }
    if (!layoutRefactoring) {
      layoutRefactoring = this.engines.layoutRefactoring.refactorLayouts();
    }
    if (!themeGeneration) {
      themeGeneration = this.engines.themeBuilder.generateThemes();
    }

    return {
      regressionReport,
      validationReport,
      previewGeneration,
      frontendBuild,
      componentGeneration,
      layoutRefactoring,
      themeGeneration,
    };
  }

  createRestorePoint(): RestorePoint {
    if (!this.config.enabled) {
      throw new Error("Rollback Manager is disabled by configuration");
    }
    this.status = "creating_restore_point";
    try {
      const upstream = this.collectUpstream();
      const point = this.manager.createRestorePoint({
        config: this.config,
        ...upstream,
      });
      this.performance.restorePointsCreated += 1;
      this.status = "idle";
      return point;
    } catch (error) {
      this.status = "failed";
      throw error;
    }
  }

  executeRollback(manualTrigger?: RollbackTrigger): RollbackRunReport {
    if (!this.config.enabled) {
      throw new Error("Rollback Manager is disabled by configuration");
    }

    const started = Date.now();
    this.status = "rolling_back";

    try {
      const upstream = this.collectUpstream();
      const report = this.manager.executeRollback({
        config: this.config,
        ...upstream,
        manualTrigger,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalRollbacks += report.reports.length;
      this.performance.verifiedRollbacks += report.reports.filter(
        (r) => r.rollbackStatus === "verified",
      ).length;
      this.performance.peakRollbackDurationMs = Math.max(
        this.performance.peakRollbackDurationMs,
        report.durationMs,
      );
      if (this.performance.totalRollbacks > 0) {
        this.performance.averageRollbackDurationMs = Math.round(
          (this.performance.averageRollbackDurationMs *
            (this.performance.totalRollbacks - report.reports.length) +
            report.durationMs) /
            Math.max(1, this.performance.totalRollbacks),
        );
      }

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulRollbacks += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedRollbacks += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Rollback decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordRollback(success, report.validation.decision);
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rollback failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedRollbacks += 1;
      appendRollbackLog({ event: "rollback_manager_failure", level: "error", details: message });
      throw error;
    }
  }
}
