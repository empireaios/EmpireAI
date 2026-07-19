/** X1-02 — Business Opportunity Discovery Controller. */

import { appendBodLog } from "./bod-logging.js";
import { BusinessOpportunityDiscoveryManager } from "./business-opportunity-discovery-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BusinessOpportunityDiscoveryConfiguration } from "./configuration.js";
import type {
  ConnectBusinessOpportunityDiscoveryInput,
  DiscoverOpportunitiesInput,
  EngineStatus,
  OpportunityActionInput,
  OpportunityPerformanceStats,
  OpportunityRunReport,
} from "./types.js";

export class BusinessOpportunityDiscoveryController {
  private config: BusinessOpportunityDiscoveryConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: OpportunityRunReport | null = null;
  private readonly manager: BusinessOpportunityDiscoveryManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: OpportunityPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    discoveriesRun: 0,
    monitoringRuns: 0,
    scoringRuns: 0,
    rankingRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: BusinessOpportunityDiscoveryManager,
    config: BusinessOpportunityDiscoveryConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBodLog({
      event: "engine_initialization",
      level: "info",
      details: "Business Opportunity Discovery ready (X1-02)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BusinessOpportunityDiscoveryConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BusinessOpportunityDiscoveryConfiguration): void {
    this.config = config;
  }

  getLatestReport(): OpportunityRunReport | null {
    return this.latestReport;
  }

  getManager(): BusinessOpportunityDiscoveryManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): OpportunityPerformanceStats {
    return { ...this.performance };
  }

  connectBusinessOpportunityDiscovery(
    input: ConnectBusinessOpportunityDiscoveryInput = {},
  ): OpportunityRunReport {
    if (!this.config.enabled) throw new Error("Business Opportunity Discovery is disabled");
    this.status = "connecting";
    const report = this.manager.connectBusinessOpportunityDiscovery(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  discoverOpportunities(input: DiscoverOpportunitiesInput = {}): OpportunityRunReport {
    this.status = "discovering";
    this.performance.discoveriesRun += 1;
    const report = this.manager.discoverOpportunities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorMarketTrends(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.status = "monitoring";
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorMarketTrends(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorEmergingIndustries(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorEmergingIndustries(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCustomerDemand(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorCustomerDemand(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorCompetitorActivity(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.monitoringRuns += 1;
    const report = this.manager.monitorCompetitorActivity(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  identifyUnderservedMarkets(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.discoveriesRun += 1;
    const report = this.manager.identifyUnderservedMarkets(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  identifyProfitableNiches(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.discoveriesRun += 1;
    const report = this.manager.identifyProfitableNiches(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  scoreOpportunities(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.scoringRuns += 1;
    const report = this.manager.scoreOpportunities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  rankOpportunities(input: OpportunityActionInput = {}): OpportunityRunReport {
    this.performance.rankingRuns += 1;
    const report = this.manager.rankOpportunities(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: OpportunityRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        `${report.action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
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
    appendBodLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
