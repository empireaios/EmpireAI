/** R4-14 — Customer Risk Controller. */

import { appendCreLog } from "./cre-logging.js";
import { CustomerRiskManager } from "./customer-risk-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type {
  CalculateCustomerRiskScoreInput,
  ConnectCustomerRiskEngineInput,
  CustomerRiskPerformanceStats,
  CustomerRiskRunReport,
  DetectAccountAbuseInput,
  DetectCustomerRiskFailuresInput,
  DetectFraudIndicatorsInput,
  DetectSuspiciousCommunicationInput,
  DetectSuspiciousPurchasingInput,
  DetectSuspiciousReturnBehaviourInput,
  EngineStatus,
  EvaluateCustomerRiskInput,
  GenerateCustomerRiskAlertsInput,
  RecommendMitigationActionsInput,
} from "./types.js";

export class CustomerRiskController {
  private config: CustomerRiskEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CustomerRiskRunReport | null = null;
  private readonly manager: CustomerRiskManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CustomerRiskPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    riskEvaluations: 0,
    fraudDetected: 0,
    abuseDetected: 0,
    purchasingFlags: 0,
    returnFlags: 0,
    communicationFlags: 0,
    scoresCalculated: 0,
    alertsGenerated: 0,
    mitigationsRecommended: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CustomerRiskManager, config: CustomerRiskEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCreLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Risk Engine ready (R4-14)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerRiskEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerRiskEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CustomerRiskRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerRiskManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CustomerRiskPerformanceStats {
    return { ...this.performance };
  }

  connectCustomerRiskEngine(input: ConnectCustomerRiskEngineInput = {}): CustomerRiskRunReport {
    if (!this.config.enabled) throw new Error("Customer Risk Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCustomerRiskEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  evaluateCustomerRisk(input: EvaluateCustomerRiskInput): CustomerRiskRunReport {
    this.performance.riskEvaluations += 1;
    const report = this.manager.evaluateCustomerRisk(input, this.config);
    this.finalizeOperation(report, "evaluate_risk");
    return report;
  }

  detectFraudIndicators(input: DetectFraudIndicatorsInput): CustomerRiskRunReport {
    const report = this.manager.detectFraudIndicators(input, this.config);
    this.performance.fraudDetected += report.customerRiskRecords.length;
    this.finalizeOperation(report, "detect_fraud");
    return report;
  }

  detectAccountAbuse(input: DetectAccountAbuseInput): CustomerRiskRunReport {
    const report = this.manager.detectAccountAbuse(input, this.config);
    this.performance.abuseDetected += report.customerRiskRecords.length;
    this.finalizeOperation(report, "detect_abuse");
    return report;
  }

  detectSuspiciousPurchasingBehaviour(
    input: DetectSuspiciousPurchasingInput,
  ): CustomerRiskRunReport {
    const report = this.manager.detectSuspiciousPurchasingBehaviour(input, this.config);
    this.performance.purchasingFlags += report.customerRiskRecords.length;
    this.finalizeOperation(report, "detect_purchasing");
    return report;
  }

  detectSuspiciousReturnBehaviour(
    input: DetectSuspiciousReturnBehaviourInput,
  ): CustomerRiskRunReport {
    const report = this.manager.detectSuspiciousReturnBehaviour(input, this.config);
    this.performance.returnFlags += report.customerRiskRecords.length;
    this.finalizeOperation(report, "detect_returns");
    return report;
  }

  detectSuspiciousCommunicationPatterns(
    input: DetectSuspiciousCommunicationInput,
  ): CustomerRiskRunReport {
    const report = this.manager.detectSuspiciousCommunicationPatterns(input, this.config);
    this.performance.communicationFlags += report.customerRiskRecords.length;
    this.finalizeOperation(report, "detect_communication");
    return report;
  }

  calculateCustomerRiskScore(input: CalculateCustomerRiskScoreInput): CustomerRiskRunReport {
    this.performance.scoresCalculated += 1;
    const report = this.manager.calculateCustomerRiskScore(input, this.config);
    this.finalizeOperation(report, "calculate_score");
    return report;
  }

  generateCustomerRiskAlerts(input: GenerateCustomerRiskAlertsInput = {}): CustomerRiskRunReport {
    const report = this.manager.generateCustomerRiskAlerts(input, this.config);
    this.performance.alertsGenerated += report.alerts.length;
    this.finalizeOperation(report, "generate_alerts");
    return report;
  }

  recommendMitigationActions(input: RecommendMitigationActionsInput): CustomerRiskRunReport {
    this.performance.mitigationsRecommended += 1;
    const report = this.manager.recommendMitigationActions(input, this.config);
    this.finalizeOperation(report, "recommend_mitigation");
    return report;
  }

  detectCustomerRiskFailures(input: DetectCustomerRiskFailuresInput = {}): CustomerRiskRunReport {
    const report = this.manager.detectCustomerRiskFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportCustomerRiskStatus(): CustomerRiskRunReport {
    const report = this.manager.reportCustomerRiskStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportCustomerRiskHealth(): CustomerRiskRunReport {
    const report = this.manager.reportCustomerRiskHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: CustomerRiskRunReport, action: string): void {
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
    appendCreLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
