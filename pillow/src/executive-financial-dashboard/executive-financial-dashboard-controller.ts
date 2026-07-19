/** R3-16 — Executive Financial Dashboard Controller. */

import { appendEfdLog } from "./efd-logging.js";
import { ExecutiveFinancialDashboardManager } from "./executive-financial-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type {
  AggregateFinancialKpisInput,
  ConnectExecutiveFinancialDashboardInput,
  DashboardPerformanceStats,
  EngineStatus,
  ExecutiveDashboardRunReport,
  GenerateExecutiveSummaryInput,
  GetDashboardWidgetsInput,
  RefreshExecutiveDashboardInput,
} from "./types.js";

export class ExecutiveFinancialDashboardController {
  private config: ExecutiveFinancialDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ExecutiveDashboardRunReport | null = null;
  private readonly manager: ExecutiveFinancialDashboardManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: DashboardPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    refreshesPerformed: 0,
    summariesGenerated: 0,
    kpisAggregated: 0,
    widgetsServed: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ExecutiveFinancialDashboardManager, config: ExecutiveFinancialDashboardConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEfdLog({
      event: "engine_initialization",
      level: "info",
      details: "Executive Financial Dashboard ready (R3-16)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExecutiveFinancialDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutiveFinancialDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ExecutiveDashboardRunReport | null {
    return this.latestReport;
  }

  getManager(): ExecutiveFinancialDashboardManager {
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

  connectExecutiveFinancialDashboard(
    input: ConnectExecutiveFinancialDashboardInput = {},
  ): ExecutiveDashboardRunReport {
    if (!this.config.enabled) throw new Error("Executive Financial Dashboard is disabled");
    this.status = "connecting";
    const report = this.manager.connectExecutiveFinancialDashboard(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  refreshExecutiveDashboard(
    input: RefreshExecutiveDashboardInput = {},
  ): ExecutiveDashboardRunReport {
    this.status = "processing";
    this.performance.refreshesPerformed += 1;
    const report = this.manager.refreshExecutiveDashboard(input, this.config);
    this.finalizeOperation(report, "refresh_dashboard");
    return report;
  }

  generateExecutiveSummary(
    input: GenerateExecutiveSummaryInput = {},
  ): ExecutiveDashboardRunReport {
    this.performance.summariesGenerated += 1;
    const report = this.manager.generateExecutiveSummary(input, this.config);
    this.finalizeOperation(report, "generate_summary");
    return report;
  }

  aggregateFinancialKpis(
    input: AggregateFinancialKpisInput = {},
  ): ExecutiveDashboardRunReport {
    this.performance.kpisAggregated += 1;
    const report = this.manager.aggregateFinancialKpis(input, this.config);
    this.finalizeOperation(report, "aggregate_kpis");
    return report;
  }

  getDashboardWidgets(input: GetDashboardWidgetsInput = {}): ExecutiveDashboardRunReport {
    this.performance.widgetsServed += 1;
    const report = this.manager.getDashboardWidgets(input, this.config);
    this.finalizeOperation(report, "get_widgets");
    return report;
  }

  private finalizeOperation(report: ExecutiveDashboardRunReport, action: string): void {
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
    appendEfdLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
