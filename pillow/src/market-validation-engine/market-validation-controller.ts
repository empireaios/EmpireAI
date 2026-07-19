/** X1-03 — Market Validation Controller. */

import { appendMveLog } from "./mve-logging.js";
import { MarketValidationManager } from "./market-validation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { MarketValidationEngineConfiguration } from "./configuration.js";
import type {
  ConnectMarketValidationEngineInput,
  EngineStatus,
  MarketValidationActionInput,
  MarketValidationPerformanceStats,
  MarketValidationRunReport,
  ValidateOpportunityInput,
} from "./types.js";

export class MarketValidationController {
  private config: MarketValidationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: MarketValidationRunReport | null = null;
  private readonly manager: MarketValidationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: MarketValidationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    validationsRun: 0,
    demandAnalyses: 0,
    customerValidations: 0,
    competitiveValidations: 0,
    scoringRuns: 0,
    recommendationRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: MarketValidationManager, config: MarketValidationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendMveLog({
      event: "engine_initialization",
      level: "info",
      details: "Market Validation Engine ready (X1-03)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): MarketValidationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: MarketValidationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): MarketValidationRunReport | null {
    return this.latestReport;
  }

  getManager(): MarketValidationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): MarketValidationPerformanceStats {
    return { ...this.performance };
  }

  connectMarketValidationEngine(
    input: ConnectMarketValidationEngineInput = {},
  ): MarketValidationRunReport {
    if (!this.config.enabled) throw new Error("Market Validation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectMarketValidationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateOpportunity(input: ValidateOpportunityInput = {}): MarketValidationRunReport {
    this.status = "validating";
    this.performance.validationsRun += 1;
    const report = this.manager.validateOpportunity(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateMarketDemand(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    this.status = "validating";
    this.performance.demandAnalyses += 1;
    const report = this.manager.validateMarketDemand(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCustomerInterest(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    this.performance.customerValidations += 1;
    const report = this.manager.validateCustomerInterest(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCompetitiveLandscape(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    this.performance.competitiveValidations += 1;
    const report = this.manager.validateCompetitiveLandscape(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateMarketSize(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    this.performance.demandAnalyses += 1;
    const report = this.manager.validateMarketSize(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateProfitabilityPotential(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    this.performance.scoringRuns += 1;
    const report = this.manager.validateProfitabilityPotential(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateValidationConfidence(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    this.performance.scoringRuns += 1;
    const report = this.manager.calculateValidationConfidence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  identifyMarketRisks(input: MarketValidationActionInput = {}): MarketValidationRunReport {
    const report = this.manager.identifyMarketRisks(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateInvestmentRecommendation(
    input: MarketValidationActionInput = {},
  ): MarketValidationRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.generateInvestmentRecommendation(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: MarketValidationRunReport): void {
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
    appendMveLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
