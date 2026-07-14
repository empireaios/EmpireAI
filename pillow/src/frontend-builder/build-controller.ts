/** T3-01 — Frontend Builder orchestration controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import { appendBuildLog } from "./build-logging.js";
import { FrontendBuilderManager } from "./frontend-builder-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FrontendBuilderConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  FrontendBuildPerformanceStats,
  FrontendBuildReport,
} from "./types.js";

export type FrontendBuilderEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  navigationMapping: NavigationMappingEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  uxScoring: UxScoringEngine;
  recommendationEngine: RecommendationEngine;
  uxIntelligenceCertification: UxIntelligenceCertificationEngine;
};

export class BuildController {
  private config: FrontendBuilderConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FrontendBuildReport | null = null;
  private readonly manager = new FrontendBuilderManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: FrontendBuildPerformanceStats = {
    totalBuilds: 0,
    successfulBuilds: 0,
    failedBuilds: 0,
    totalRecordsGenerated: 0,
    averageRecordsPerBuild: 0,
    averageBuildDurationMs: 0,
    peakBuildDurationMs: 0,
  };

  constructor(
    private readonly engines: FrontendBuilderEngineBundle,
    config: FrontendBuilderConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendBuildLog({
      event: "frontend_builder_initialized",
      level: "info",
      details: "Frontend Builder started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendBuildLog({
      event: "frontend_builder_stop",
      level: "info",
      details: "Frontend Builder stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FrontendBuilderConfiguration {
    return this.config;
  }

  updateConfiguration(config: FrontendBuilderConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FrontendBuildReport | null {
    return this.latestReport;
  }

  getPerformance(): FrontendBuildPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  generateFrontendCode(): FrontendBuildReport {
    const started = Date.now();
    this.status = "building";

    try {
      const uiState = this.engines.uiStateMapper.getLatestState();
      const navigation = this.engines.navigationMapping.getLatestGraph();
      let recommendations = this.engines.recommendationEngine.getLatestRecord();
      const uxScore = this.engines.uxScoring.getLatestRecord();
      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();
      const certification = this.engines.uxIntelligenceCertification.getLatestReport();

      if (!recommendations) {
        appendBuildLog({
          event: "partial_build_input",
          level: "warn",
          details: "No recommendation record — attempting generation",
        });
        this.engines.recommendationEngine.generateRecommendations();
        recommendations = this.engines.recommendationEngine.getLatestRecord();
      }

      const screenId =
        uiState?.screen.screenId ??
        uxScore?.screenId ??
        navigation?.metadata.currentScreenId ??
        null;
      const routeOrViewId =
        navigation?.metadata.currentRouteId ??
        navigation?.metadata.currentViewId ??
        uxScore?.routeOrViewId ??
        null;

      const report = this.manager.generateBuildReport({
        config: this.config,
        recommendations,
        uxScore,
        designSystem,
        executiveStyle,
        certification,
        screenId,
        routeOrViewId,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalBuilds += 1;
      this.performance.totalRecordsGenerated += report.records.length;
      this.performance.averageRecordsPerBuild = Math.round(
        this.performance.totalRecordsGenerated / this.performance.totalBuilds,
      );
      this.performance.peakBuildDurationMs = Math.max(
        this.performance.peakBuildDurationMs,
        report.durationMs,
      );
      this.performance.averageBuildDurationMs = Math.round(
        (this.performance.averageBuildDurationMs * (this.performance.totalBuilds - 1) +
          report.durationMs) /
          this.performance.totalBuilds,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulBuilds += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedBuilds += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordBuild(Date.now() - started, success, report.validation.decision);

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Frontend build failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalBuilds += 1;
      this.performance.failedBuilds += 1;
      appendBuildLog({
        event: "builder_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
