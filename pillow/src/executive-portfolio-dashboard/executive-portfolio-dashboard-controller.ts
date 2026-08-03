/** X2-06 — Executive Portfolio Dashboard orchestration controller. */

import { appendEpdLog } from "./epd-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ExecutivePortfolioDashboardManager } from "./executive-portfolio-dashboard-manager.js";
import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";
import type {
  AggregatePortfolioKpisInput,
  ConnectExecutiveDashboardInput,
  DashboardPerformanceStats,
  DashboardRunReport,
  DrillDownInput,
  EngineStatus,
  GenerateExecutiveAlertsInput,
  RecommendExecutiveInput,
  RefreshDashboardInput,
  RunDashboardDiagnosticsInput,
} from "./types.js";

export class ExecutivePortfolioDashboardController {
  private config: ExecutivePortfolioDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: DashboardRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: DashboardPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    dashboardRefreshes: 0,
    kpiAggregations: 0,
    alertsGenerated: 0,
    recommendationsGenerated: 0,
    drillDowns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ExecutivePortfolioDashboardManager,
    config: ExecutivePortfolioDashboardConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEpdLog({
      event: "framework_initialized",
      level: "info",
      details: "Executive Portfolio Dashboard ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExecutivePortfolioDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutivePortfolioDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): DashboardRunReport | null {
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

  getPerformance(): DashboardPerformanceStats {
    return { ...this.performance };
  }

  connectExecutivePortfolioDashboard(
    input: ConnectExecutiveDashboardInput = {},
  ): DashboardRunReport {
    if (!this.config.enabled) {
      throw new Error("Executive Portfolio Dashboard is disabled");
    }
    this.status = "connecting";
    const report = this.manager.connectExecutivePortfolioDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  refreshDashboard(input: RefreshDashboardInput = {}): DashboardRunReport {
    this.status = "refreshing";
    const report = this.manager.refreshDashboard(input, this.config);
    if (report.validation.decision !== "fail") this.performance.dashboardRefreshes += 1;
    this.finalizeOperation(report);
    return report;
  }

  aggregatePortfolioKpis(input: AggregatePortfolioKpisInput = {}): DashboardRunReport {
    const report = this.manager.aggregatePortfolioKpis(input, this.config);
    if (report.validation.decision !== "fail") this.performance.kpiAggregations += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateExecutiveAlerts(input: GenerateExecutiveAlertsInput = {}): DashboardRunReport {
    const report = this.manager.generateExecutiveAlerts(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.alertsGenerated += report.snapshot?.executiveAlerts.length ?? 0;
    }
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendExecutiveInput = {}): DashboardRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated +=
        report.snapshot?.executiveRecommendations.length ?? 0;
    }
    this.finalizeOperation(report);
    return report;
  }

  drillDown(input: DrillDownInput): DashboardRunReport {
    const report = this.manager.drillDown(input, this.config);
    if (report.validation.decision !== "fail") this.performance.drillDowns += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunDashboardDiagnosticsInput = {}): DashboardRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
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
    appendEpdLog({
      event: "dashboard_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
