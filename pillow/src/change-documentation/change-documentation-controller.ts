/** T3-09 — Change Documentation orchestration controller. */

import type { RollbackManagerEngine } from "../rollback-manager/engine.js";
import type { RegressionProtectionEngine } from "../regression-protection/engine.js";
import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import { appendChangeDocumentationLog } from "./change-documentation-logging.js";
import { ChangeDocumentationManager } from "./change-documentation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ChangeDocumentationConfiguration } from "./configuration.js";
import type {
  ChangeDocumentationPerformanceStats,
  ChangeDocumentationRunReport,
  EngineStatus,
} from "./types.js";

export type ChangeDocumentationEngineBundle = {
  rollbackManager: RollbackManagerEngine;
  regressionProtection: RegressionProtectionEngine;
  validationEngine: ValidationEngine;
  previewGenerator: PreviewGenerator;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutRefactoring: LayoutRefactoringEngine;
  themeBuilder: ThemeBuilder;
};

export class ChangeDocumentationController {
  private config: ChangeDocumentationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ChangeDocumentationRunReport | null = null;
  private readonly manager = new ChangeDocumentationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ChangeDocumentationPerformanceStats = {
    totalDocumentations: 0,
    successfulDocumentations: 0,
    failedDocumentations: 0,
    totalRecordsDocumented: 0,
    averageRecordsPerRun: 0,
    averageDocumentationDurationMs: 0,
    peakDocumentationDurationMs: 0,
  };

  constructor(
    private readonly engines: ChangeDocumentationEngineBundle,
    config: ChangeDocumentationConfiguration,
    private readonly repositoryRoot?: string,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendChangeDocumentationLog({
      event: "change_documentation_initialized",
      level: "info",
      details: "Change Documentation started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendChangeDocumentationLog({
      event: "change_documentation_stop",
      level: "info",
      details: "Change Documentation stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ChangeDocumentationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ChangeDocumentationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ChangeDocumentationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ChangeDocumentationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  private collectUpstream() {
    let rollbackReport = this.engines.rollbackManager.getLatestReport();
    let regressionReport = this.engines.regressionProtection.getLatestReport();
    let validationReport = this.engines.validationEngine.getLatestReport();
    let previewGeneration = this.engines.previewGenerator.getLatestReport();
    let frontendBuild = this.engines.frontendBuilder.getLatestReport();
    let componentGeneration = this.engines.componentGenerator.getLatestReport();
    let layoutRefactoring = this.engines.layoutRefactoring.getLatestReport();
    let themeGeneration = this.engines.themeBuilder.getLatestReport();

    if (!regressionReport) {
      appendChangeDocumentationLog({
        event: "partial_documentation_input",
        level: "warn",
        details: "No regression report",
      });
      regressionReport = this.engines.regressionProtection.checkRegressions();
    }
    if (!validationReport) {
      appendChangeDocumentationLog({
        event: "partial_documentation_input",
        level: "warn",
        details: "No validation report",
      });
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
      rollbackReport,
      regressionReport,
      validationReport,
      previewGeneration,
      frontendBuild,
      componentGeneration,
      layoutRefactoring,
      themeGeneration,
    };
  }

  documentChanges(): ChangeDocumentationRunReport {
    if (!this.config.enabled) {
      throw new Error("Change Documentation is disabled by configuration");
    }

    this.status = "documenting";

    try {
      const upstream = this.collectUpstream();
      const report = this.manager.documentChanges({
        config: this.config,
        repositoryRoot: this.repositoryRoot,
        ...upstream,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalDocumentations += 1;
      this.performance.totalRecordsDocumented += report.records.length;
      this.performance.peakDocumentationDurationMs = Math.max(
        this.performance.peakDocumentationDurationMs,
        report.durationMs,
      );
      if (this.performance.totalDocumentations > 0) {
        this.performance.averageRecordsPerRun = Math.round(
          this.performance.totalRecordsDocumented / this.performance.totalDocumentations,
        );
        this.performance.averageDocumentationDurationMs = Math.round(
          (this.performance.averageDocumentationDurationMs *
            (this.performance.totalDocumentations - 1) +
            report.durationMs) /
            this.performance.totalDocumentations,
        );
      }

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulDocumentations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedDocumentations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Documentation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordDocumentation(success, report.validation.decision);
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Documentation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedDocumentations += 1;
      appendChangeDocumentationLog({
        event: "documentation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
