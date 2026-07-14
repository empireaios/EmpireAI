/** T3-02 — Component Generator orchestration controller. */

import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import { appendGenerationLog } from "./generation-logging.js";
import { ComponentGeneratorManager } from "./component-generator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";
import type {
  ComponentGenerationReport,
  ComponentGeneratorPerformanceStats,
  EngineStatus,
} from "./types.js";

export type ComponentGeneratorEngineBundle = {
  recommendationEngine: RecommendationEngine;
  frontendBuilder: FrontendBuilder;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
};

export class GenerationController {
  private config: ComponentGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ComponentGenerationReport | null = null;
  private readonly manager = new ComponentGeneratorManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ComponentGeneratorPerformanceStats = {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalComponentsGenerated: 0,
    duplicatesSkipped: 0,
    averageComponentsPerGeneration: 0,
    averageGenerationDurationMs: 0,
    peakGenerationDurationMs: 0,
  };

  constructor(
    private readonly engines: ComponentGeneratorEngineBundle,
    config: ComponentGeneratorConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendGenerationLog({
      event: "component_generator_initialized",
      level: "info",
      details: "Component Generator started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendGenerationLog({
      event: "component_generator_stop",
      level: "info",
      details: "Component Generator stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ComponentGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ComponentGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ComponentGenerationReport | null {
    return this.latestReport;
  }

  getPerformance(): ComponentGeneratorPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  generateComponents(): ComponentGenerationReport {
    const started = Date.now();
    this.status = "generating";

    try {
      let recommendations = this.engines.recommendationEngine.getLatestRecord();
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();

      if (!recommendations) {
        appendGenerationLog({
          event: "partial_generation_input",
          level: "warn",
          details: "No recommendations — attempting generation",
        });
        this.engines.recommendationEngine.generateRecommendations();
        recommendations = this.engines.recommendationEngine.getLatestRecord();
      }

      if (!frontendBuild) {
        appendGenerationLog({
          event: "partial_generation_input",
          level: "warn",
          details: "No frontend build — attempting build",
        });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }

      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();

      const report = this.manager.generateReport({
        config: this.config,
        recommendations,
        frontendBuild,
        designSystem,
        executiveStyle,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalGenerations += 1;
      this.performance.totalComponentsGenerated += report.records.length;
      this.performance.duplicatesSkipped += report.records.filter(
        (r) => r.generationStatus === "duplicate_skipped",
      ).length;
      this.performance.averageComponentsPerGeneration = Math.round(
        this.performance.totalComponentsGenerated / this.performance.totalGenerations,
      );
      this.performance.peakGenerationDurationMs = Math.max(
        this.performance.peakGenerationDurationMs,
        report.durationMs,
      );
      this.performance.averageGenerationDurationMs = Math.round(
        (this.performance.averageGenerationDurationMs *
          (this.performance.totalGenerations - 1) +
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
      const message = error instanceof Error ? error.message : "Component generation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalGenerations += 1;
      this.performance.failedGenerations += 1;
      appendGenerationLog({
        event: "generator_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
