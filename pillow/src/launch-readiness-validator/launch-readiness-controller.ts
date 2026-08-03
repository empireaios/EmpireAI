/** X1-10 — Launch Readiness Controller. */

import { appendLrvLog } from "./lrv-logging.js";
import { LaunchReadinessManager } from "./launch-readiness-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LaunchReadinessValidatorConfiguration } from "./configuration.js";
import type {
  ConnectLaunchReadinessValidatorInput,
  EngineStatus,
  LaunchActionInput,
  LaunchPerformanceStats,
  LaunchRunReport,
  ValidateLaunchReadinessInput,
} from "./types.js";

export class LaunchReadinessController {
  private config: LaunchReadinessValidatorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LaunchRunReport | null = null;
  private readonly manager: LaunchReadinessManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LaunchPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    validationsRun: 0,
    scoringRuns: 0,
    blockerDetectionRuns: 0,
    recommendationRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: LaunchReadinessManager, config: LaunchReadinessValidatorConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLrvLog({
      event: "engine_initialization",
      level: "info",
      details: "Launch Readiness Validator ready (X1-10)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LaunchReadinessValidatorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LaunchReadinessValidatorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LaunchRunReport | null {
    return this.latestReport;
  }

  getManager(): LaunchReadinessManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): LaunchPerformanceStats {
    return { ...this.performance };
  }

  connectLaunchReadinessValidator(
    input: ConnectLaunchReadinessValidatorInput = {},
  ): LaunchRunReport {
    if (!this.config.enabled) throw new Error("Launch Readiness Validator is disabled");
    this.status = "connecting";
    const report = this.manager.connectLaunchReadinessValidator(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateLaunchReadiness(input: ValidateLaunchReadinessInput = {}): LaunchRunReport {
    this.status = "validating";
    this.performance.validationsRun += 1;
    const report = this.manager.validateLaunchReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateBusinessConfiguration(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validateBusinessConfiguration(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateBrandReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validateBrandReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateDigitalAssetReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validateDigitalAssetReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateStorefrontReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validateStorefrontReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateProductPortfolioReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validateProductPortfolioReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validatePricingReadiness(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.validationsRun += 1;
    const report = this.manager.validatePricingReadiness(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  detectLaunchBlockers(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.blockerDetectionRuns += 1;
    const report = this.manager.detectLaunchBlockers(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  calculateReadinessScore(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.scoringRuns += 1;
    const report = this.manager.calculateReadinessScore(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateLaunchRecommendations(input: LaunchActionInput = {}): LaunchRunReport {
    this.performance.recommendationRuns += 1;
    const report = this.manager.generateLaunchRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LaunchRunReport): void {
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
    appendLrvLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
