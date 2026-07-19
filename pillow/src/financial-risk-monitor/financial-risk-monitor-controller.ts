/** R3-15 — Financial Risk Monitor Controller. */

import { appendFrmLog } from "./frm-logging.js";
import { FinancialRiskMonitorManager } from "./financial-risk-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { FinancialRiskMonitorConfiguration } from "./configuration.js";
import type {
  CalculateFinancialRiskScoreInput,
  ConnectFinancialRiskMonitorInput,
  DetectFinancialAnomaliesInput,
  DetectThresholdBreachesInput,
  EngineStatus,
  FinancialRiskRunReport,
  GenerateFinancialRiskAlertsInput,
  MonitorFinancialHealthInput,
  RiskPerformanceStats,
} from "./types.js";

export class FinancialRiskMonitorController {
  private config: FinancialRiskMonitorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: FinancialRiskRunReport | null = null;
  private readonly manager: FinancialRiskMonitorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RiskPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    healthChecksPerformed: 0,
    riskScoresCalculated: 0,
    anomaliesDetected: 0,
    thresholdBreachesDetected: 0,
    alertsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: FinancialRiskMonitorManager, config: FinancialRiskMonitorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendFrmLog({
      event: "engine_initialization",
      level: "info",
      details: "Financial Risk Monitor ready (R3-15)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): FinancialRiskMonitorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: FinancialRiskMonitorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): FinancialRiskRunReport | null {
    return this.latestReport;
  }

  getManager(): FinancialRiskMonitorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): RiskPerformanceStats {
    return { ...this.performance };
  }

  connectFinancialRiskMonitor(
    input: ConnectFinancialRiskMonitorInput = {},
  ): FinancialRiskRunReport {
    if (!this.config.enabled) throw new Error("Financial Risk Monitor is disabled");
    this.status = "connecting";
    const report = this.manager.connectFinancialRiskMonitor(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  monitorFinancialHealth(
    input: MonitorFinancialHealthInput = {},
  ): FinancialRiskRunReport {
    this.status = "processing";
    this.performance.healthChecksPerformed += 1;
    const report = this.manager.monitorFinancialHealth(input, this.config);
    this.trackAlertsAndAnomalies(report);
    this.finalizeOperation(report, "monitor_health");
    return report;
  }

  calculateFinancialRiskScore(
    input: CalculateFinancialRiskScoreInput = {},
  ): FinancialRiskRunReport {
    this.performance.riskScoresCalculated += 1;
    const report = this.manager.calculateFinancialRiskScore(input, this.config);
    this.trackAlertsAndAnomalies(report);
    this.finalizeOperation(report, "calculate_risk_score");
    return report;
  }

  detectFinancialAnomalies(
    input: DetectFinancialAnomaliesInput = {},
  ): FinancialRiskRunReport {
    const report = this.manager.detectFinancialAnomalies(input, this.config);
    this.trackAlertsAndAnomalies(report);
    this.finalizeOperation(report, "detect_anomalies");
    return report;
  }

  detectThresholdBreaches(
    input: DetectThresholdBreachesInput = {},
  ): FinancialRiskRunReport {
    const report = this.manager.detectThresholdBreaches(input, this.config);
    this.trackAlertsAndAnomalies(report);
    this.finalizeOperation(report, "detect_threshold_breaches");
    return report;
  }

  generateFinancialRiskAlerts(
    input: GenerateFinancialRiskAlertsInput = {},
  ): FinancialRiskRunReport {
    const report = this.manager.generateFinancialRiskAlerts(input, this.config);
    this.trackAlertsAndAnomalies(report);
    this.finalizeOperation(report, "generate_alerts");
    return report;
  }

  private trackAlertsAndAnomalies(report: FinancialRiskRunReport): void {
    if (report.anomalies.length > 0) {
      this.performance.anomaliesDetected += report.anomalies.length;
    }
    if (report.alerts.length > 0) {
      this.performance.alertsGenerated += report.alerts.length;
      const breaches = report.alerts.filter((a) => a.thresholdBreached).length;
      this.performance.thresholdBreachesDetected += breaches;
    }
  }

  private finalizeOperation(report: FinancialRiskRunReport, action: string): void {
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
    appendFrmLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
