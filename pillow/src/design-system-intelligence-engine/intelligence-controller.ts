/** T2-02 — Design System Intelligence controller. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import { appendDesignSystemLog } from "./design-system-logging.js";
import { DesignSystemIntelligenceManager } from "./design-system-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";
import type {
  DesignSystemAnalysisReport,
  IntelligencePerformanceStats,
  IntelligenceStatus,
} from "./types.js";

export type IntelligenceEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  uxRuleEngine: UxRuleEngine;
};

export class IntelligenceController {
  private config: DesignSystemIntelligenceConfiguration;
  private status: IntelligenceStatus = "idle";
  private latestReport: DesignSystemAnalysisReport | null = null;
  private readonly manager = new DesignSystemIntelligenceManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: IntelligencePerformanceStats = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    totalComponentsDiscovered: 0,
    totalDeviationsDetected: 0,
    averageAnalysisDurationMs: 0,
    peakAnalysisDurationMs: 0,
  };

  constructor(
    private readonly repositoryRoot: string,
    private readonly engines: IntelligenceEngineBundle,
    config: DesignSystemIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendDesignSystemLog({
      event: "design_system_intelligence_start",
      level: "info",
      details: "Design System Intelligence engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendDesignSystemLog({
      event: "design_system_intelligence_stop",
      level: "info",
      details: "Design System Intelligence engine stopped",
    });
  }

  getStatus(): IntelligenceStatus {
    return this.status;
  }

  getConfiguration(): DesignSystemIntelligenceConfiguration {
    return this.config;
  }

  updateConfiguration(config: DesignSystemIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): DesignSystemAnalysisReport | null {
    return this.latestReport;
  }

  getLatestModel() {
    return this.manager.getLatestModel();
  }

  getPerformance(): IntelligencePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): DesignSystemIntelligenceManager {
    return this.manager;
  }

  componentsLearned(): number {
    return this.manager.getLatestModel()?.componentLibrary.length ?? 0;
  }

  runAnalysis(): DesignSystemAnalysisReport {
    const started = Date.now();
    this.status = "analyzing";

    try {
      const recognition = this.engines.componentRecognition.getLatestResult();
      const layout = this.engines.layoutUnderstanding.getLatestLayout();
      const uiState = this.engines.uiStateMapper.getLatestState();
      const sessionId = uiState?.metadata.sessionId ?? `dsi-${Date.now()}`;

      if (!recognition) {
        appendDesignSystemLog({
          event: "partial_scan",
          level: "warn",
          details: "No component recognition data — partial design system analysis",
        });
      }

      const report = this.manager.runAnalysis({
        repositoryRoot: this.repositoryRoot,
        sessionId,
        config: this.config,
        recognition,
        layout,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalAnalyses += 1;
      this.performance.totalComponentsDiscovered = report.model.componentLibrary.length;
      this.performance.totalDeviationsDetected = report.validation.deviations.length;
      this.performance.peakAnalysisDurationMs = Math.max(
        this.performance.peakAnalysisDurationMs,
        report.durationMs,
      );
      this.performance.averageAnalysisDurationMs = Math.round(
        (this.performance.averageAnalysisDurationMs * (this.performance.totalAnalyses - 1) +
          report.durationMs) /
          this.performance.totalAnalyses,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulAnalyses += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedAnalyses += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.manager.reset();
          this.status = "idle";
        }
      }

      this.healthMonitor.recordAnalysis(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      for (const deviation of report.validation.deviations) {
        appendDesignSystemLog({
          event: "validation_result",
          level: deviation.severity === "error" ? "error" : "warn",
          details: `${deviation.category}: ${deviation.description}`,
        });
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalAnalyses += 1;
      this.performance.failedAnalyses += 1;

      appendDesignSystemLog({
        event: "analysis_failure",
        level: "error",
        details: message,
      });

      throw error;
    }
  }
}
