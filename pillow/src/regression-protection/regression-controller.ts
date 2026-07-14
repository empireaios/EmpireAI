/** T3-07 — Regression Protection orchestration controller. */

import type { ValidationEngine } from "../validation-engine/engine.js";
import type { PreviewGenerator } from "../preview-generator/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { VisualFoundationCertificationEngine } from "../visual-foundation-certification-engine/engine.js";
import { appendRegressionLog } from "./regression-logging.js";
import { RegressionProtectionManager } from "./regression-protection-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { RegressionProtectionConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  RegressionProtectionPerformanceStats,
  RegressionRunReport,
} from "./types.js";

export type RegressionProtectionEngineBundle = {
  validationEngine: ValidationEngine;
  previewGenerator: PreviewGenerator;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  uxScoring: UxScoringEngine;
  recommendationEngine: RecommendationEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  visualFoundationCertification: VisualFoundationCertificationEngine;
};

export class RegressionController {
  private config: RegressionProtectionConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RegressionRunReport | null = null;
  private readonly manager = new RegressionProtectionManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RegressionProtectionPerformanceStats = {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    totalRegressionsDetected: 0,
    blockedChanges: 0,
    averageRegressionsPerCheck: 0,
    averageCheckDurationMs: 0,
    peakCheckDurationMs: 0,
  };

  constructor(
    private readonly engines: RegressionProtectionEngineBundle,
    config: RegressionProtectionConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendRegressionLog({
      event: "regression_protection_initialized",
      level: "info",
      details: "Regression Protection started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendRegressionLog({
      event: "regression_protection_stop",
      level: "info",
      details: "Regression Protection stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RegressionProtectionConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RegressionProtectionConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RegressionRunReport | null {
    return this.latestReport;
  }

  getPerformance(): RegressionProtectionPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  checkRegressions(): RegressionRunReport {
    if (!this.config.enabled) {
      throw new Error("Regression Protection is disabled by configuration");
    }

    const started = Date.now();
    this.status = "checking";

    try {
      let validationReport = this.engines.validationEngine.getLatestReport();
      let previewGeneration = this.engines.previewGenerator.getLatestReport();
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();
      let uxScoring = this.engines.uxScoring.getLatestReport();
      let recommendationReport = this.engines.recommendationEngine.getLatestReport();
      let componentGeneration = this.engines.componentGenerator.getLatestReport();

      if (!validationReport) {
        appendRegressionLog({
          event: "partial_regression_input",
          level: "warn",
          details: "No validation report — running validation first",
        });
        validationReport = this.engines.validationEngine.validateUi();
      }
      if (!previewGeneration) {
        appendRegressionLog({
          event: "partial_regression_input",
          level: "warn",
          details: "No preview build",
        });
        previewGeneration = this.engines.previewGenerator.generatePreviews();
      }
      if (!frontendBuild) {
        appendRegressionLog({
          event: "partial_regression_input",
          level: "warn",
          details: "No frontend build",
        });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }
      if (!uxScoring) {
        appendRegressionLog({
          event: "partial_regression_input",
          level: "warn",
          details: "No UX score",
        });
        uxScoring = this.engines.uxScoring.runScoring();
      }
      if (!recommendationReport) {
        appendRegressionLog({
          event: "partial_regression_input",
          level: "warn",
          details: "No recommendations",
        });
        recommendationReport = this.engines.recommendationEngine.generateRecommendations();
      }
      if (!componentGeneration) {
        componentGeneration = this.engines.componentGenerator.generateComponents();
      }

      const report = this.manager.runCheck({
        config: this.config,
        validationReport,
        previewGeneration,
        frontendBuild,
        uxScoring,
        recommendationReport,
        componentGeneration,
        layoutModel: this.engines.layoutUnderstanding.getLatestLayout(),
        navigationGraph: this.engines.navigationMapping.getLatestGraph(),
        visualFoundation: this.engines.visualFoundationCertification.getLatestReport(),
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalChecks += 1;
      this.performance.totalRegressionsDetected += report.validation.regressionsDetected;
      this.performance.averageRegressionsPerCheck = Math.round(
        this.performance.totalRegressionsDetected / this.performance.totalChecks,
      );
      this.performance.peakCheckDurationMs = Math.max(
        this.performance.peakCheckDurationMs,
        report.durationMs,
      );
      this.performance.averageCheckDurationMs = Math.round(
        (this.performance.averageCheckDurationMs * (this.performance.totalChecks - 1) +
          report.durationMs) /
          this.performance.totalChecks,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulChecks += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedChecks += 1;
        if (report.validation.decision === "blocked") {
          this.performance.blockedChanges += 1;
        }
        const shouldRecover = this.recoveryManager.recordFailure(
          `Protection decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordCheck(success, report.validation.decision);
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Regression check failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalChecks += 1;
      this.performance.failedChecks += 1;
      appendRegressionLog({
        event: "regression_protection_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
