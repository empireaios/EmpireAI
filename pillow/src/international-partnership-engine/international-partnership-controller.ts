/** X4-12 — International Partnership Engine orchestration controller. */

import { appendIpeLog } from "./ipe-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { InternationalPartnershipManager } from "./international-partnership-manager.js";
import type { InternationalPartnershipEngineConfiguration } from "./configuration.js";
import type {
  ConnectInternationalPartnershipEngineInput,
  EngineStatus,
  IpePerformanceStats,
  IpeRunReport,
  PartnershipAnalysisInput,
  RunIpeDiagnosticsInput,
} from "./types.js";

export class InternationalPartnershipController {
  private config: InternationalPartnershipEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: IpeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: IpePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    strategicPartnershipOps: 0,
    regionalNetworkOps: 0,
    prospectiveEvaluations: 0,
    performanceMonitors: 0,
    reliabilityMonitors: 0,
    valueMonitors: 0,
    riskDetections: 0,
    opportunityDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: InternationalPartnershipManager,
    config: InternationalPartnershipEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendIpeLog({
      event: "engine_initialized",
      level: "info",
      details:
        "International Partnership Engine ready — structural signals only; never approve strategic partnerships without validation",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): InternationalPartnershipEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: InternationalPartnershipEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): IpeRunReport | null {
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

  getPerformance(): IpePerformanceStats {
    return { ...this.performance };
  }

  connectInternationalPartnershipEngine(
    input: ConnectInternationalPartnershipEngineInput = {},
  ): IpeRunReport {
    if (!this.config.enabled) {
      throw new Error("International Partnership Engine is disabled");
    }
    this.status = "connecting";
    const report = this.manager.connectInternationalPartnershipEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageStrategicPartnerships(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "evaluating";
    const report = this.manager.manageStrategicPartnerships(input, this.config);
    if (report.validation.decision !== "fail") this.performance.strategicPartnershipOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageRegionalPartnerNetworks(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "evaluating";
    const report = this.manager.manageRegionalPartnerNetworks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalNetworkOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  evaluateProspectivePartners(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateProspectivePartners(input, this.config);
    if (report.validation.decision !== "fail") this.performance.prospectiveEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorPartnerPerformance(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorPartnerPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorPartnerReliability(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorPartnerReliability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.reliabilityMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorPartnershipValue(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorPartnershipValue(input, this.config);
    if (report.validation.decision !== "fail") this.performance.valueMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectPartnershipRisks(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "analyzing";
    const report = this.manager.detectPartnershipRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectPartnershipOpportunities(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "analyzing";
    const report = this.manager.detectPartnershipOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendPartnership(input: PartnershipAnalysisInput = {}): IpeRunReport {
    this.status = "recommending";
    const report = this.manager.recommendPartnership(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunIpeDiagnosticsInput = {}): IpeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: IpeRunReport): void {
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
    appendIpeLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
