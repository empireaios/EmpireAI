/** X1-05 — Brand Creation Controller. */

import { appendBceLog } from "./bce-logging.js";
import { BrandCreationManager } from "./brand-creation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { BrandCreationEngineConfiguration } from "./configuration.js";
import type {
  BrandActionInput,
  BrandPerformanceStats,
  BrandRunReport,
  ConnectBrandCreationEngineInput,
  CreateBrandInput,
  EngineStatus,
} from "./types.js";

export class BrandCreationController {
  private config: BrandCreationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: BrandRunReport | null = null;
  private readonly manager: BrandCreationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: BrandPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    brandsCreated: 0,
    namingRuns: 0,
    identityRuns: 0,
    guidelineRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: BrandCreationManager, config: BrandCreationEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendBceLog({
      event: "engine_initialization",
      level: "info",
      details: "Brand Creation Engine ready (X1-05)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): BrandCreationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: BrandCreationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): BrandRunReport | null {
    return this.latestReport;
  }

  getManager(): BrandCreationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): BrandPerformanceStats {
    return { ...this.performance };
  }

  connectBrandCreationEngine(input: ConnectBrandCreationEngineInput = {}): BrandRunReport {
    if (!this.config.enabled) throw new Error("Brand Creation Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectBrandCreationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  createBrand(input: CreateBrandInput = {}): BrandRunReport {
    this.status = "generating";
    this.performance.brandsCreated += 1;
    const report = this.manager.createBrand(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCompanyName(input: BrandActionInput = {}): BrandRunReport {
    this.performance.namingRuns += 1;
    const report = this.manager.generateCompanyName(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandIdentity(input: BrandActionInput = {}): BrandRunReport {
    this.performance.identityRuns += 1;
    const report = this.manager.generateBrandIdentity(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandPositioning(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateBrandPositioning(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandMessaging(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateBrandMessaging(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandValues(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateBrandValues(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandVoice(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateBrandVoice(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateColourRecommendations(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateColourRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateTypographyRecommendations(input: BrandActionInput = {}): BrandRunReport {
    const report = this.manager.generateTypographyRecommendations(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateBrandGuidelines(input: BrandActionInput = {}): BrandRunReport {
    this.performance.guidelineRuns += 1;
    const report = this.manager.generateBrandGuidelines(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: BrandRunReport): void {
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
    appendBceLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
