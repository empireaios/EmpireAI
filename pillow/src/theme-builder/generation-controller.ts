/** T3-04 — Theme Builder orchestration controller. */

import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import { appendThemeLog } from "./theme-logging.js";
import { ThemeBuilderManager } from "./theme-builder-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ThemeBuilderConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  ThemeBuilderPerformanceStats,
  ThemeGenerationReport,
} from "./types.js";

export type ThemeBuilderEngineBundle = {
  recommendationEngine: RecommendationEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutRefactoring: LayoutRefactoringEngine;
};

export class GenerationController {
  private config: ThemeBuilderConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ThemeGenerationReport | null = null;
  private readonly manager = new ThemeBuilderManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ThemeBuilderPerformanceStats = {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalThemesGenerated: 0,
    averageThemesPerGeneration: 0,
    averageGenerationDurationMs: 0,
    peakGenerationDurationMs: 0,
  };

  constructor(
    private readonly engines: ThemeBuilderEngineBundle,
    config: ThemeBuilderConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendThemeLog({
      event: "theme_builder_initialized",
      level: "info",
      details: "Theme Builder started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendThemeLog({
      event: "theme_builder_stop",
      level: "info",
      details: "Theme Builder stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ThemeBuilderConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ThemeBuilderConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ThemeGenerationReport | null {
    return this.latestReport;
  }

  getPerformance(): ThemeBuilderPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  generateThemes(): ThemeGenerationReport {
    const started = Date.now();
    this.status = "generating";

    try {
      let recommendations = this.engines.recommendationEngine.getLatestRecord();
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();
      let componentGeneration = this.engines.componentGenerator.getLatestReport();
      let layoutRefactoring = this.engines.layoutRefactoring.getLatestReport();

      if (!recommendations) {
        appendThemeLog({ event: "partial_theme_input", level: "warn", details: "No recommendations" });
        this.engines.recommendationEngine.generateRecommendations();
        recommendations = this.engines.recommendationEngine.getLatestRecord();
      }

      if (!frontendBuild) {
        appendThemeLog({ event: "partial_theme_input", level: "warn", details: "No frontend build" });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }

      if (!componentGeneration) {
        appendThemeLog({ event: "partial_theme_input", level: "warn", details: "No component generation" });
        componentGeneration = this.engines.componentGenerator.generateComponents();
      }

      if (!layoutRefactoring) {
        appendThemeLog({ event: "partial_theme_input", level: "warn", details: "No layout refactoring" });
        layoutRefactoring = this.engines.layoutRefactoring.refactorLayouts();
      }

      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();

      const report = this.manager.generateReport({
        config: this.config,
        recommendations,
        designSystem,
        executiveStyle,
        frontendBuild,
        componentGeneration,
        layoutRefactoring,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalGenerations += 1;
      this.performance.totalThemesGenerated += report.records.length;
      this.performance.averageThemesPerGeneration = Math.round(
        this.performance.totalThemesGenerated / this.performance.totalGenerations,
      );
      this.performance.peakGenerationDurationMs = Math.max(
        this.performance.peakGenerationDurationMs,
        report.durationMs,
      );
      this.performance.averageGenerationDurationMs = Math.round(
        (this.performance.averageGenerationDurationMs * (this.performance.totalGenerations - 1) +
          report.durationMs) /
          this.performance.totalGenerations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulGenerations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedGenerations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordGeneration(success, report.validation.decision);
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Theme generation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalGenerations += 1;
      this.performance.failedGenerations += 1;
      appendThemeLog({ event: "theme_builder_failure", level: "error", details: message });
      throw error;
    }
  }
}
