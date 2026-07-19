/** R3-07 — Cash Flow Monitor Controller. */

import { appendCfLog } from "./cf-logging.js";
import { CashFlowMonitorManager } from "./cash-flow-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type {
  AggregateCashFlowInput,
  CashFlowMonitorRunReport,
  CashFlowPerformanceStats,
  ConnectCashFlowMonitorInput,
  EngineStatus,
  ForecastCashAvailabilityInput,
  MonitorCashFlowInput,
  MonitorInflowsInput,
  MonitorLiquidityInput,
  MonitorOutflowsInput,
} from "./types.js";

export class CashFlowMonitorController {
  private config: CashFlowMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CashFlowMonitorRunReport | null = null;
  private readonly manager: CashFlowMonitorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CashFlowPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    inflowMonitoringRuns: 0,
    outflowMonitoringRuns: 0,
    liquidityChecks: 0,
    forecastsGenerated: 0,
    aggregationsRun: 0,
    anomaliesDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CashFlowMonitorManager, config: CashFlowMonitorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCfLog({
      event: "monitor_initialization",
      level: "info",
      details: "Cash Flow Monitor ready (R3-07)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CashFlowMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CashFlowMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CashFlowMonitorRunReport | null {
    return this.latestReport;
  }

  getManager(): CashFlowMonitorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CashFlowPerformanceStats {
    return { ...this.performance };
  }

  connectCashFlowMonitor(
    input: ConnectCashFlowMonitorInput = {},
  ): CashFlowMonitorRunReport {
    if (!this.config.enabled) throw new Error("Cash Flow Monitor is disabled");
    this.status = "connecting";
    appendCfLog({
      event: "connection_attempt",
      level: "info",
      details: "connectCashFlowMonitor started",
    });
    const report = this.manager.connectCashFlowMonitor(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  monitorCashFlow(input: MonitorCashFlowInput = {}): CashFlowMonitorRunReport {
    this.status = "monitoring";
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorCashFlow(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "monitor");
    return report;
  }

  monitorInflows(input: MonitorInflowsInput = {}): CashFlowMonitorRunReport {
    this.performance.inflowMonitoringRuns += 1;
    const report = this.manager.monitorInflows(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "monitor_inflows");
    return report;
  }

  monitorOutflows(input: MonitorOutflowsInput = {}): CashFlowMonitorRunReport {
    this.performance.outflowMonitoringRuns += 1;
    const report = this.manager.monitorOutflows(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "monitor_outflows");
    return report;
  }

  monitorLiquidity(input: MonitorLiquidityInput = {}): CashFlowMonitorRunReport {
    this.performance.liquidityChecks += 1;
    const report = this.manager.monitorLiquidity(input, this.config);
    this.trackAnomalies(report);
    this.finalizeOperation(report, "monitor_liquidity");
    return report;
  }

  forecastCashAvailability(
    input: ForecastCashAvailabilityInput = {},
  ): CashFlowMonitorRunReport {
    this.status = "forecasting";
    this.performance.forecastsGenerated += 1;
    const report = this.manager.forecastCashAvailability(input, this.config);
    this.finalizeOperation(report, "forecast");
    return report;
  }

  aggregateCashFlow(input: AggregateCashFlowInput = {}): CashFlowMonitorRunReport {
    this.performance.aggregationsRun += 1;
    const report = this.manager.aggregateCashFlow(input, this.config);
    this.finalizeOperation(report, "aggregate");
    return report;
  }

  private trackAnomalies(report: CashFlowMonitorRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
  }

  private finalizeOperation(report: CashFlowMonitorRunReport, action: string): void {
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
        report.monitorRecord.currentOperationalState === "active" ? "active" : "connected";
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
    appendCfLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
