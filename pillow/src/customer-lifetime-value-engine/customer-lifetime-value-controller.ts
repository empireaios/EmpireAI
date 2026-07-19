/** R4-15 — Customer Lifetime Value Controller. */

import { appendClveLog } from "./clve-logging.js";
import { CustomerLifetimeValueManager } from "./customer-lifetime-value-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerLifetimeValueEngineConfiguration } from "./configuration.js";
import type {
  CalculateCustomerLifetimeValueInput,
  ClvPerformanceStats,
  ClvRunReport,
  ConnectClvEngineInput,
  DetectClvFailuresInput,
  EngineStatus,
  IdentifyDecliningCustomerValueInput,
  IdentifyHighValueCustomersInput,
  PredictFutureCustomerValueInput,
  TrackAverageOrderValueInput,
  TrackCustomerProfitabilityInput,
  TrackCustomerRetentionInput,
  TrackCustomerRevenueInput,
  TrackPurchaseFrequencyInput,
} from "./types.js";

export class CustomerLifetimeValueController {
  private config: CustomerLifetimeValueEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ClvRunReport | null = null;
  private readonly manager: CustomerLifetimeValueManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ClvPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    clvCalculations: 0,
    revenueAnalyses: 0,
    profitabilityAnalyses: 0,
    retentionAnalyses: 0,
    purchaseFrequencyTracked: 0,
    averageOrderValueTracked: 0,
    predictionsGenerated: 0,
    highValueIdentified: 0,
    decliningValueIdentified: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CustomerLifetimeValueManager, config: CustomerLifetimeValueEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendClveLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Lifetime Value Engine ready (R4-15)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerLifetimeValueEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerLifetimeValueEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ClvRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerLifetimeValueManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ClvPerformanceStats {
    return { ...this.performance };
  }

  connectClvEngine(input: ConnectClvEngineInput = {}): ClvRunReport {
    if (!this.config.enabled) throw new Error("Customer Lifetime Value Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectClvEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  calculateCustomerLifetimeValue(input: CalculateCustomerLifetimeValueInput): ClvRunReport {
    this.performance.clvCalculations += 1;
    const report = this.manager.calculateCustomerLifetimeValue(input, this.config);
    this.finalizeOperation(report, "calculate_clv");
    return report;
  }

  trackCustomerRevenueContribution(input: TrackCustomerRevenueInput): ClvRunReport {
    this.performance.revenueAnalyses += 1;
    const report = this.manager.trackCustomerRevenueContribution(input, this.config);
    this.finalizeOperation(report, "track_revenue");
    return report;
  }

  trackCustomerProfitability(input: TrackCustomerProfitabilityInput): ClvRunReport {
    this.performance.profitabilityAnalyses += 1;
    const report = this.manager.trackCustomerProfitability(input, this.config);
    this.finalizeOperation(report, "track_profitability");
    return report;
  }

  trackCustomerRetention(input: TrackCustomerRetentionInput): ClvRunReport {
    this.performance.retentionAnalyses += 1;
    const report = this.manager.trackCustomerRetention(input, this.config);
    this.finalizeOperation(report, "track_retention");
    return report;
  }

  trackPurchaseFrequency(input: TrackPurchaseFrequencyInput): ClvRunReport {
    this.performance.purchaseFrequencyTracked += 1;
    const report = this.manager.trackPurchaseFrequency(input, this.config);
    this.finalizeOperation(report, "track_purchase_frequency");
    return report;
  }

  trackAverageOrderValue(input: TrackAverageOrderValueInput): ClvRunReport {
    this.performance.averageOrderValueTracked += 1;
    const report = this.manager.trackAverageOrderValue(input, this.config);
    this.finalizeOperation(report, "track_average_order_value");
    return report;
  }

  predictFutureCustomerValue(input: PredictFutureCustomerValueInput): ClvRunReport {
    this.performance.predictionsGenerated += 1;
    const report = this.manager.predictFutureCustomerValue(input, this.config);
    this.finalizeOperation(report, "predict_future_value");
    return report;
  }

  identifyHighValueCustomers(input: IdentifyHighValueCustomersInput = {}): ClvRunReport {
    const report = this.manager.identifyHighValueCustomers(input, this.config);
    this.performance.highValueIdentified += report.insights.length;
    this.finalizeOperation(report, "identify_high_value");
    return report;
  }

  identifyDecliningCustomerValue(input: IdentifyDecliningCustomerValueInput = {}): ClvRunReport {
    const report = this.manager.identifyDecliningCustomerValue(input, this.config);
    this.performance.decliningValueIdentified += report.insights.length;
    this.finalizeOperation(report, "identify_declining_value");
    return report;
  }

  detectClvFailures(input: DetectClvFailuresInput = {}): ClvRunReport {
    const report = this.manager.detectClvFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportClvStatus(): ClvRunReport {
    const report = this.manager.reportClvStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportClvHealth(): ClvRunReport {
    const report = this.manager.reportClvHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: ClvRunReport, action: string): void {
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
    appendClveLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
