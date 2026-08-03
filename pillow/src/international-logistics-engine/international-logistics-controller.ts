/** X4-08 — International Logistics Engine orchestration controller. */

import { appendIleLog } from "./ile-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { InternationalLogisticsManager } from "./international-logistics-manager.js";
import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import type {
  ConnectInternationalLogisticsEngineInput,
  EngineStatus,
  IlePerformanceStats,
  IleRunReport,
  LogisticsAnalysisInput,
  RunIleDiagnosticsInput,
} from "./types.js";

export class InternationalLogisticsController {
  private config: InternationalLogisticsEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: IleRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: IlePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    shippingNetworkOps: 0,
    providerMonitors: 0,
    performanceMonitors: 0,
    deliveryMonitors: 0,
    capacityMonitors: 0,
    costMonitors: 0,
    bottleneckDetections: 0,
    fulfillmentRiskDetections: 0,
    routeOptimizations: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: InternationalLogisticsManager,
    config: InternationalLogisticsEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendIleLog({
      event: "engine_initialized",
      level: "info",
      details:
        "International Logistics Engine ready — structural signals only; never recommend with unvalidated data",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): InternationalLogisticsEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: InternationalLogisticsEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): IleRunReport | null {
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

  getPerformance(): IlePerformanceStats {
    return { ...this.performance };
  }

  connectInternationalLogisticsEngine(
    input: ConnectInternationalLogisticsEngineInput = {},
  ): IleRunReport {
    if (!this.config.enabled) throw new Error("International Logistics Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectInternationalLogisticsEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageShippingNetworks(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.manageShippingNetworks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.shippingNetworkOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorProviders(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorProviders(input, this.config);
    if (report.validation.decision !== "fail") this.performance.providerMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorShippingPerformance(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorShippingPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorDeliveryTimes(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorDeliveryTimes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.deliveryMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorFulfillmentCapacity(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorFulfillmentCapacity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capacityMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorShippingCosts(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorShippingCosts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.costMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectBottlenecks(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "analyzing";
    const report = this.manager.detectBottlenecks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.bottleneckDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectFulfillmentRisks(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "analyzing";
    const report = this.manager.detectFulfillmentRisks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.fulfillmentRiskDetections += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  optimizeRoutes(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "optimizing";
    const report = this.manager.optimizeRoutes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.routeOptimizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendLogistics(input: LogisticsAnalysisInput = {}): IleRunReport {
    this.status = "recommending";
    const report = this.manager.recommendLogistics(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunIleDiagnosticsInput = {}): IleRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: IleRunReport): void {
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
    appendIleLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
