/** R4-18 — Executive Customer Dashboard Controller. */

import { appendEcdLog } from "./ecd-logging.js";
import { ExecutiveCustomerDashboardManager } from "./executive-customer-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ExecutiveCustomerDashboardConfiguration } from "./configuration.js";
import type {
  ConnectExecutiveCustomerDashboardInput,
  DashboardPerformanceStats,
  DetectDashboardFailuresInput,
  EngineStatus,
  ExecutiveCustomerDashboardRunReport,
  GetDashboardWidgetsInput,
  RefreshExecutiveCustomerDashboardInput,
} from "./types.js";

export class ExecutiveCustomerDashboardController {
  private config: ExecutiveCustomerDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveCustomerDashboardRunReport | null = null;
  private lastRefreshAt: string | null = null;
  private readonly manager: ExecutiveCustomerDashboardManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: DashboardPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    refreshesPerformed: 0,
    displaysPerformed: 0,
    summariesGenerated: 0,
    kpisAggregated: 0,
    widgetsServed: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: ExecutiveCustomerDashboardManager,
    config: ExecutiveCustomerDashboardConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEcdLog({
      event: "engine_initialization",
      level: "info",
      details: "Executive Customer Dashboard ready (R4-18)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExecutiveCustomerDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutiveCustomerDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExecutiveCustomerDashboardRunReport | null {
    return this.latestReport;
  }

  getLastRefreshAt(): string | null {
    return this.lastRefreshAt;
  }

  getManager(): ExecutiveCustomerDashboardManager {
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

  connectExecutiveCustomerDashboard(
    input: ConnectExecutiveCustomerDashboardInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    if (!this.config.enabled) throw new Error("Executive Customer Dashboard is disabled");
    this.status = "connecting";
    const report = this.manager.connectExecutiveCustomerDashboard(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  refreshExecutiveCustomerDashboard(
    input: RefreshExecutiveCustomerDashboardInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    this.performance.refreshesPerformed += 1;
    const report = this.manager.refreshExecutiveCustomerDashboard(input, this.config);
    if (report.snapshots.length > 0) this.lastRefreshAt = report.runTimestamp;
    this.finalizeOperation(report, "refresh_dashboard");
    return report;
  }

  displayCustomerGrowth(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerGrowth(this.config);
    this.finalizeOperation(report, "display_growth");
    return report;
  }

  displayCustomerActivity(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerActivity(this.config);
    this.finalizeOperation(report, "display_activity");
    return report;
  }

  displayCustomerLifetimeValue(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerLifetimeValue(this.config);
    this.finalizeOperation(report, "display_lifetime_value");
    return report;
  }

  displayCustomerSegmentation(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerSegmentation(this.config);
    this.finalizeOperation(report, "display_segmentation");
    return report;
  }

  displayCustomerSentiment(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerSentiment(this.config);
    this.finalizeOperation(report, "display_sentiment");
    return report;
  }

  displayCustomerLoyalty(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerLoyalty(this.config);
    this.finalizeOperation(report, "display_loyalty");
    return report;
  }

  displayCustomerJourneyAnalytics(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerJourneyAnalytics(this.config);
    this.finalizeOperation(report, "display_journey");
    return report;
  }

  displayCustomerRisk(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerRisk(this.config);
    this.finalizeOperation(report, "display_risk");
    return report;
  }

  displayCustomerSupportMetrics(): ExecutiveCustomerDashboardRunReport {
    this.performance.displaysPerformed += 1;
    const report = this.manager.displayCustomerSupportMetrics(this.config);
    this.finalizeOperation(report, "display_support");
    return report;
  }

  aggregateExecutiveCustomerKpis(): ExecutiveCustomerDashboardRunReport {
    this.performance.kpisAggregated += 1;
    const report = this.manager.aggregateExecutiveCustomerKpis(this.config);
    this.finalizeOperation(report, "aggregate_kpis");
    return report;
  }

  getDashboardWidgets(input: GetDashboardWidgetsInput = {}): ExecutiveCustomerDashboardRunReport {
    this.performance.widgetsServed += 1;
    const report = this.manager.getDashboardWidgets(input, this.config);
    this.finalizeOperation(report, "get_widgets");
    return report;
  }

  detectDashboardFailures(
    input: DetectDashboardFailuresInput = {},
  ): ExecutiveCustomerDashboardRunReport {
    const report = this.manager.detectDashboardFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportDashboardStatus(): ExecutiveCustomerDashboardRunReport {
    const report = this.manager.reportDashboardStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportDashboardHealth(): ExecutiveCustomerDashboardRunReport {
    const report = this.manager.reportDashboardHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(
    report: ExecutiveCustomerDashboardRunReport,
    action: string,
  ): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendEcdLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
