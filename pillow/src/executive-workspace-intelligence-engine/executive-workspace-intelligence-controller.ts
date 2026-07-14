/** T5-08 — Executive Workspace Intelligence orchestration controller. */

import { appendWorkspaceLog } from "./ewi-logging.js";
import type { ExecutiveWorkspaceIntelligenceConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  EngineStatus,
  ExecutiveWorkspaceIntelligenceEngineBundle,
  ExecutiveWorkspaceIntelligenceInput,
  ExecutiveWorkspaceIntelligenceRunReport,
  WorkspaceCategory,
  WorkspaceIntelligenceRecord,
  WorkspacePerformanceStats,
} from "./types.js";
import { ExecutiveWorkspaceIntelligenceManager } from "./executive-workspace-intelligence-manager.js";

function countCategory(
  records: { workspaceCategory: WorkspaceCategory }[],
  categories: WorkspaceCategory[],
): number {
  return records.filter((r) => categories.includes(r.workspaceCategory)).length;
}

export class ExecutiveWorkspaceIntelligenceController {
  private config: ExecutiveWorkspaceIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveWorkspaceIntelligenceRunReport | null = null;
  private readonly manager = new ExecutiveWorkspaceIntelligenceManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousOptimizationActive = false;
  private optimizationTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: WorkspacePerformanceStats = {
    totalOptimizationCycles: 0,
    successfulOptimizationCycles: 0,
    failedOptimizationCycles: 0,
    totalRecommendations: 0,
    dashboardRecommendations: 0,
    layoutRecommendations: 0,
    widgetRecommendations: 0,
    shortcutRecommendations: 0,
    missionAnalyses: 0,
    duplicatesSkipped: 0,
    averageOptimizationDurationMs: 0,
    peakOptimizationDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: ExecutiveWorkspaceIntelligenceEngineBundle,
    config: ExecutiveWorkspaceIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendWorkspaceLog({
      event: "executive_workspace_intelligence_initialized",
      level: "info",
      details: "Executive Workspace Intelligence engine ready (recommend-only)",
    });
    if (this.config.continuousOptimizationEnabled && this.config.enabled) {
      this.startContinuousOptimization();
    }
  }

  stop(): void {
    this.stopContinuousOptimization();
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousOptimizationActive(): boolean {
    return this.continuousOptimizationActive;
  }

  getConfiguration(): ExecutiveWorkspaceIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutiveWorkspaceIntelligenceConfiguration): void {
    const wasActive = this.continuousOptimizationActive;
    if (wasActive) this.stopContinuousOptimization();
    this.config = config;
    if (config.continuousOptimizationEnabled && config.enabled) {
      this.startContinuousOptimization();
    }
  }

  getLatestReport(): ExecutiveWorkspaceIntelligenceRunReport | null {
    return this.latestReport;
  }

  getTopRecommendations(): WorkspaceIntelligenceRecord[] {
    return this.manager.getTopRecommendations();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getPerformance(): WorkspacePerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ExecutiveWorkspaceIntelligenceManager {
    return this.manager;
  }

  startContinuousOptimization(): void {
    if (!this.config.enabled || this.optimizationTimer) return;
    this.continuousOptimizationActive = true;
    this.status = "optimizing";
    this.manager.getSessionManager().setContinuousOptimizationActive(true);
    appendWorkspaceLog({
      event: "executive_workspace_optimization_start",
      level: "info",
      details: "Continuous workspace optimization activated",
    });
    this.optimizationTimer = setInterval(() => {
      try {
        this.optimizeWorkspace({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.workspaceOptimizationFrequencyMs);
  }

  stopContinuousOptimization(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    this.continuousOptimizationActive = false;
    this.manager.getSessionManager().setContinuousOptimizationActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.workspaceSessionId);
    }
    appendWorkspaceLog({
      event: "executive_workspace_optimization_end",
      level: "info",
      details: "Continuous workspace optimization deactivated",
    });
  }

  optimizeWorkspace(
    input: ExecutiveWorkspaceIntelligenceInput = {},
  ): ExecutiveWorkspaceIntelligenceRunReport {
    if (!this.config.enabled) {
      throw new Error("Executive Workspace Intelligence is disabled by configuration");
    }
    if (!this.config.recommendOnlyMode) {
      throw new Error("Executive Workspace Intelligence must remain recommend-only");
    }

    this.status = "analyzing_missions";
    this.performance.missionAnalyses += 1;

    try {
      this.status = "generating_recommendations";
      const report = this.manager.optimizeWorkspace({
        workspaceInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalOptimizationCycles += 1;
      this.performance.totalRecommendations += report.records.length;

      const records = report.records;
      this.performance.dashboardRecommendations += countCategory(records, [
        "mission_dashboard",
        "executive_dashboard",
        "operations_dashboard",
        "workflow_dashboard",
        "analytics_dashboard",
        "productivity_dashboard",
      ]);
      this.performance.layoutRecommendations += countCategory(records, [
        "workspace_layout_optimization",
        "context_aware_workspace",
        "priority_based_workspace",
        "role_based_workspace",
        "operational_workspace_optimization",
      ]);
      this.performance.widgetRecommendations += records.filter(
        (r) => r.recommendedWidgets.length > 0,
      ).length;
      this.performance.shortcutRecommendations += records.filter(
        (r) => r.recommendedShortcuts.length > 0,
      ).length;

      this.performance.peakOptimizationDurationMs = Math.max(
        this.performance.peakOptimizationDurationMs,
        report.durationMs,
      );
      this.performance.averageOptimizationDurationMs = Math.round(
        (this.performance.averageOptimizationDurationMs *
          (this.performance.totalOptimizationCycles - 1) +
          report.durationMs) /
          this.performance.totalOptimizationCycles,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulOptimizationCycles += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordOptimization(true, report.validation.decision);
        this.status = this.continuousOptimizationActive ? "optimizing" : "idle";
      } else {
        this.performance.failedOptimizationCycles += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordOptimization(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedOptimizationCycles += 1;
      const message = error instanceof Error ? error.message : "Optimization failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
