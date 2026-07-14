/** T3-05 — Preview Generator orchestration controller. */

import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { LayoutRefactoringEngine } from "../layout-refactoring/engine.js";
import type { ThemeBuilder } from "../theme-builder/engine.js";
import { appendPreviewLog } from "./preview-logging.js";
import { PreviewGeneratorManager } from "./preview-generator-manager.js";
import { PreviewHealthMonitor } from "./preview-health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  PreviewGeneratorPerformanceStats,
  PreviewGenerationReport,
} from "./types.js";

export type PreviewGeneratorEngineBundle = {
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutRefactoring: LayoutRefactoringEngine;
  themeBuilder: ThemeBuilder;
};

export class GenerationController {
  private config: PreviewGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PreviewGenerationReport | null = null;
  private readonly manager = new PreviewGeneratorManager();
  private readonly healthMonitor = new PreviewHealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PreviewGeneratorPerformanceStats = {
    totalPreviews: 0,
    successfulPreviews: 0,
    failedPreviews: 0,
    totalPreviewBuilds: 0,
    averageBuildsPerPreview: 0,
    averagePreviewDurationMs: 0,
    peakPreviewDurationMs: 0,
    cleanupsPerformed: 0,
  };

  constructor(
    private readonly engines: PreviewGeneratorEngineBundle,
    config: PreviewGeneratorConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendPreviewLog({
      event: "preview_generator_initialized",
      level: "info",
      details: "Preview Generator started",
    });
  }

  stop(): void {
    this.status = "stopped";
    this.manager.cleanupEnvironments(this.config);
    appendPreviewLog({
      event: "preview_generator_stop",
      level: "info",
      details: "Preview Generator stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PreviewGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PreviewGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PreviewGenerationReport | null {
    return this.latestReport;
  }

  getPerformance(): PreviewGeneratorPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): PreviewHealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  generatePreviews(): PreviewGenerationReport {
    const started = Date.now();
    this.status = "building";

    try {
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();
      let componentGeneration = this.engines.componentGenerator.getLatestReport();
      let layoutRefactoring = this.engines.layoutRefactoring.getLatestReport();
      let themeGeneration = this.engines.themeBuilder.getLatestReport();

      if (!frontendBuild) {
        appendPreviewLog({ event: "partial_preview_input", level: "warn", details: "No frontend build" });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }
      if (!componentGeneration) {
        appendPreviewLog({ event: "partial_preview_input", level: "warn", details: "No components" });
        componentGeneration = this.engines.componentGenerator.generateComponents();
      }
      if (!layoutRefactoring) {
        appendPreviewLog({ event: "partial_preview_input", level: "warn", details: "No layouts" });
        layoutRefactoring = this.engines.layoutRefactoring.refactorLayouts();
      }
      if (!themeGeneration) {
        appendPreviewLog({ event: "partial_preview_input", level: "warn", details: "No themes" });
        themeGeneration = this.engines.themeBuilder.generateThemes();
      }

      const report = this.manager.generateReport({
        config: this.config,
        frontendBuild,
        componentGeneration,
        layoutRefactoring,
        themeGeneration,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalPreviews += 1;
      this.performance.totalPreviewBuilds += report.records.length;
      this.performance.averageBuildsPerPreview = Math.round(
        this.performance.totalPreviewBuilds / this.performance.totalPreviews,
      );
      this.performance.peakPreviewDurationMs = Math.max(
        this.performance.peakPreviewDurationMs,
        report.durationMs,
      );
      this.performance.averagePreviewDurationMs = Math.round(
        (this.performance.averagePreviewDurationMs * (this.performance.totalPreviews - 1) +
          report.durationMs) /
          this.performance.totalPreviews,
      );
      this.performance.cleanupsPerformed += this.manager.cleanupEnvironments(this.config);

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulPreviews += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedPreviews += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordPreview(
        success,
        report.validation.decision,
        this.manager.getActiveEnvironmentCount(),
      );
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Preview generation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalPreviews += 1;
      this.performance.failedPreviews += 1;
      appendPreviewLog({ event: "preview_generator_failure", level: "error", details: message });
      throw error;
    }
  }

  cleanupPreviews(): number {
    const cleaned = this.manager.cleanupEnvironments(this.config);
    this.performance.cleanupsPerformed += cleaned;
    appendPreviewLog({
      event: "preview_cleanup",
      level: "info",
      details: `Cleaned ${cleaned} preview environments`,
    });
    return cleaned;
  }

  getActiveEnvironmentCount(): number {
    return this.manager.getActiveEnvironmentCount();
  }
}
