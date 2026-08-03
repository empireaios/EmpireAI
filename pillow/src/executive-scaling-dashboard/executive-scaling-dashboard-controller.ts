/** X3-09 — Executive Scaling Dashboard orchestration controller. */

import { appendEsdLog } from "./esd-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ExecutiveScalingDashboardManager } from "./executive-scaling-dashboard-manager.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ConnectExecutiveScalingDashboardInput,
  EngineStatus,
  EsdPerformanceStats,
  EsdRunReport,
  ExecutiveScalingDashboardInput,
  RunEsdDiagnosticsInput,
} from "./types.js";

export class ExecutiveScalingDashboardController {
  private config: ExecutiveScalingDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: EsdRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: EsdPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    refreshRuns: 0,
    widgetQueries: 0,
    alertsGenerated: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ExecutiveScalingDashboardManager,
    config: ExecutiveScalingDashboardConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEsdLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Executive Scaling Dashboard ready — never expose restricted enterprise information; structural signals only",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExecutiveScalingDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutiveScalingDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): EsdRunReport | null {
    return this.latestReport;
  }

  getManager() {
    return this.manager;
  }

  getHealthMonitor() {
    return this.healthMonitor;
  }

  getRecoveryManager() {
    return this.recoveryManager;
  }

  getPerformance(): EsdPerformanceStats {
    return { ...this.performance };
  }

  connectExecutiveScalingDashboard(
    input: ConnectExecutiveScalingDashboardInput = {},
  ): EsdRunReport {
    if (!this.config.enabled) throw new Error("Executive Scaling Dashboard is disabled");
    this.status = "connecting";
    const report = this.manager.connectExecutiveScalingDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  refreshDashboard(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "refreshing";
    const report = this.manager.refreshDashboard(input, this.config);
    if (report.validation.decision !== "fail") this.performance.refreshRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  getScalingStatus(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getScalingStatus(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getScalingOpportunities(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getScalingOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getScalingDecisions(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getScalingDecisions(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getOperationalCapacity(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getOperationalCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getMarketingGrowth(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getMarketingGrowth(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getSupplierReadiness(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getSupplierReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getFinancialReadiness(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getFinancialReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getWorkforceUtilization(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "aggregating";
    const report = this.manager.getWorkforceUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.widgetQueries += 1;
    this.finalizeOperation(report);
    return report;
  }

  getExecutiveAlerts(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "alerting";
    const report = this.manager.getExecutiveAlerts(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.alertsGenerated +=
        report.dashboardSnapshots[0]?.executiveAlerts.length ?? 0;
    }
    this.finalizeOperation(report);
    return report;
  }

  getScalingRecommendations(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    this.status = "recommending";
    const report = this.manager.getScalingRecommendations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunEsdDiagnosticsInput = {}): EsdRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: EsdRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
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
    this.status = "active";
    appendEsdLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
