/** X1-04 — Business Model Generator Controller. */

import { appendBmgLog } from "./bmg-logging.js";
import { BusinessModelGeneratorManager } from "./business-model-generator-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BusinessModelGeneratorConfiguration } from "./configuration.js";
import type {
  BusinessModelActionInput,
  BusinessModelPerformanceStats,
  BusinessModelRunReport,
  ConnectBusinessModelGeneratorInput,
  EngineStatus,
  GenerateBusinessModelInput,
} from "./types.js";

export class BusinessModelGeneratorController {
  private config: BusinessModelGeneratorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BusinessModelRunReport | null = null;
  private readonly manager: BusinessModelGeneratorManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BusinessModelPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    generationsRun: 0,
    revenueModelRuns: 0,
    segmentRuns: 0,
    scoringRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: BusinessModelGeneratorManager,
    config: BusinessModelGeneratorConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBmgLog({
      event: "engine_initialization",
      level: "info",
      details: "Business Model Generator ready (X1-04)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BusinessModelGeneratorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BusinessModelGeneratorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BusinessModelRunReport | null {
    return this.latestReport;
  }

  getManager(): BusinessModelGeneratorManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): BusinessModelPerformanceStats {
    return { ...this.performance };
  }

  connectBusinessModelGenerator(
    input: ConnectBusinessModelGeneratorInput = {},
  ): BusinessModelRunReport {
    if (!this.config.enabled) throw new Error("Business Model Generator is disabled");
    this.status = "connecting";
    const report = this.manager.connectBusinessModelGenerator(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBusinessModel(input: GenerateBusinessModelInput = {}): BusinessModelRunReport {
    this.status = "generating";
    this.performance.generationsRun += 1;
    const report = this.manager.generateBusinessModel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateRevenueModel(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.revenueModelRuns += 1;
    const report = this.manager.generateRevenueModel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCostStructure(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.generationsRun += 1;
    const report = this.manager.generateCostStructure(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateValueProposition(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.generationsRun += 1;
    const report = this.manager.generateValueProposition(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCustomerSegments(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.segmentRuns += 1;
    const report = this.manager.generateCustomerSegments(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateDistributionChannels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.generationsRun += 1;
    const report = this.manager.generateDistributionChannels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generatePartnershipStrategies(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.generationsRun += 1;
    const report = this.manager.generatePartnershipStrategies(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateOperationalModels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.performance.generationsRun += 1;
    const report = this.manager.generateOperationalModels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  scoreBusinessModels(input: BusinessModelActionInput = {}): BusinessModelRunReport {
    this.status = "scoring";
    this.performance.scoringRuns += 1;
    const report = this.manager.scoreBusinessModels(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BusinessModelRunReport): void {
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
    appendBmgLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
