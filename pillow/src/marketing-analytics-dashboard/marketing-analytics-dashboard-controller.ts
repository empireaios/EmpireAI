/** R5-10 — Marketing Analytics Dashboard Controller. */

import { appendMadLog } from "./mad-logging.js";
import { MarketingAnalyticsDashboardManager } from "./marketing-analytics-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketingAnalyticsDashboardConfiguration } from "./configuration.js";
import type {
  AggregateKpisInput,
  ConnectDashboardInput,
  DashboardPerformanceStats,
  DashboardRunReport,
  EngineStatus,
  GenerateExecutiveSummaryInput,
  RefreshDashboardInput,
} from "./types.js";

export class MarketingAnalyticsDashboardController {
  private config: MarketingAnalyticsDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: DashboardRunReport | null = null;
  private readonly manager: MarketingAnalyticsDashboardManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: DashboardPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    dashboardRefreshes: 0,
    kpiAggregations: 0,
    executiveSummariesGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: MarketingAnalyticsDashboardManager,
    config: MarketingAnalyticsDashboardConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMadLog({
      event: "engine_initialization",
      level: "info",
      details: "Marketing Analytics Dashboard ready (R5-10)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketingAnalyticsDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketingAnalyticsDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): DashboardRunReport | null {
    return this.latestReport;
  }

  getManager(): MarketingAnalyticsDashboardManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): DashboardPerformanceStats {
    return { ...this.performance };
  }

  connectDashboard(input: ConnectDashboardInput = {}): DashboardRunReport {
    if (!this.config.enabled) throw new Error("Marketing Analytics Dashboard is disabled");
    this.status = "connecting";
    const report = this.manager.connectDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  refreshDashboard(input: RefreshDashboardInput = {}): DashboardRunReport {
    this.status = "refreshing";
    this.performance.dashboardRefreshes += 1;
    const report = this.manager.refreshDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  aggregateKpis(input: AggregateKpisInput = {}): DashboardRunReport {
    this.performance.kpiAggregations += 1;
    const report = this.manager.aggregateKpis(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateExecutiveSummary(input: GenerateExecutiveSummaryInput = {}): DashboardRunReport {
    this.performance.executiveSummariesGenerated += 1;
    const report = this.manager.generateExecutiveSummary(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: DashboardRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status =
        report.engineRecord.currentOperationalState === "active" ? "active" : "connected";
    }

    this.performance.averageOperationDurationMs = Math.round(
      (this.performance.averageOperationDurationMs * (this.performance.totalOperations - 1) +
        duration) /
        this.performance.totalOperations,
    );
    if (duration > this.performance.peakOperationDurationMs) {
      this.performance.peakOperationDurationMs = duration;
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    appendMadLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
