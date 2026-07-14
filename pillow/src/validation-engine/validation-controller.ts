/** T3-06 — Validation Engine orchestration controller. */

import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import { appendValidationLog } from "./validation-logging.js";
import { ValidationEngineManager } from "./validation-engine-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ValidationEngineConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ValidationEnginePerformanceStats,
  ValidationRunReport,
} from "./types.js";

export type ValidationEngineBundle = {
  previewGenerator: PreviewGenerator;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutRefactoring: LayoutRefactoringEngine;
  themeBuilder: ThemeBuilder;
};

export class ValidationController {
  private config: ValidationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ValidationRunReport | null = null;
  private readonly manager = new ValidationEngineManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ValidationEnginePerformanceStats = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    totalDefectsDetected: 0,
    blockedChanges: 0,
    averageDefectsPerValidation: 0,
    averageValidationDurationMs: 0,
    peakValidationDurationMs: 0,
  };

  constructor(
    private readonly engines: ValidationEngineBundle,
    config: ValidationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendValidationLog({
      event: "validation_engine_initialized",
      level: "info",
      details: "Validation Engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendValidationLog({
      event: "validation_engine_stop",
      level: "info",
      details: "Validation Engine stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ValidationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ValidationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ValidationRunReport | null {
    return this.latestReport;
  }

  getPerformance(): ValidationEnginePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  validateUi(): ValidationRunReport {
    if (!this.config.enabled) {
      throw new Error("Validation Engine is disabled by configuration");
    }

    const started = Date.now();
    this.status = "validating";

    try {
      let previewGeneration = this.engines.previewGenerator.getLatestReport();
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();
      let componentGeneration = this.engines.componentGenerator.getLatestReport();
      let layoutRefactoring = this.engines.layoutRefactoring.getLatestReport();
      let themeGeneration = this.engines.themeBuilder.getLatestReport();

      if (!previewGeneration) {
        appendValidationLog({
          event: "partial_validation_input",
          level: "warn",
          details: "No preview build — generating previews first",
        });
        previewGeneration = this.engines.previewGenerator.generatePreviews();
      }
      if (!frontendBuild) {
        appendValidationLog({
          event: "partial_validation_input",
          level: "warn",
          details: "No frontend build",
        });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }
      if (!componentGeneration) {
        appendValidationLog({
          event: "partial_validation_input",
          level: "warn",
          details: "No component generation",
        });
        componentGeneration = this.engines.componentGenerator.generateComponents();
      }
      if (!layoutRefactoring) {
        appendValidationLog({
          event: "partial_validation_input",
          level: "warn",
          details: "No layout refactoring",
        });
        layoutRefactoring = this.engines.layoutRefactoring.refactorLayouts();
      }
      if (!themeGeneration) {
        appendValidationLog({
          event: "partial_validation_input",
          level: "warn",
          details: "No theme generation",
        });
        themeGeneration = this.engines.themeBuilder.generateThemes();
      }

      const report = this.manager.runValidation({
        config: this.config,
        previewGeneration,
        frontendBuild,
        componentGeneration,
        layoutRefactoring,
        themeGeneration,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalValidations += 1;
      this.performance.totalDefectsDetected += report.validation.defectsDetected;
      this.performance.averageDefectsPerValidation = Math.round(
        this.performance.totalDefectsDetected / this.performance.totalValidations,
      );
      this.performance.peakValidationDurationMs = Math.max(
        this.performance.peakValidationDurationMs,
        report.durationMs,
      );
      this.performance.averageValidationDurationMs = Math.round(
        (this.performance.averageValidationDurationMs *
          (this.performance.totalValidations - 1) +
          report.durationMs) /
          this.performance.totalValidations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulValidations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedValidations += 1;
        if (report.validation.decision === "blocked") {
          this.performance.blockedChanges += 1;
        }
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordValidation(success, report.validation.decision);
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Validation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalValidations += 1;
      this.performance.failedValidations += 1;
      appendValidationLog({
        event: "validation_engine_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
