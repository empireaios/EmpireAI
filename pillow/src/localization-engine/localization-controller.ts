/** X4-03 — Localization Engine orchestration controller. */

import { appendLocLog } from "./loc-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { LocalizationManager } from "./localization-manager.js";
import type { LocalizationEngineConfiguration } from "./configuration.js";
import type {
  ConnectLocalizationEngineInput,
  EngineStatus,
  LocalizationInput,
  LocPerformanceStats,
  LocRunReport,
  RunLocDiagnosticsInput,
} from "./types.js";

export class LocalizationController {
  private config: LocalizationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LocRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LocPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    productLocalizations: 0,
    serviceLocalizations: 0,
    storefrontLocalizations: 0,
    brandLocalizations: 0,
    marketingLocalizations: 0,
    experienceLocalizations: 0,
    regionalAdaptations: 0,
    gapsDetected: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: LocalizationManager,
    config: LocalizationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendLocLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Localization Engine ready — structural signals only; never overwrite canonical source content",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LocalizationEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LocalizationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LocRunReport | null {
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

  getPerformance(): LocPerformanceStats {
    return { ...this.performance };
  }

  connectLocalizationEngine(input: ConnectLocalizationEngineInput = {}): LocRunReport {
    if (!this.config.enabled) throw new Error("Localization Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectLocalizationEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  localizeProduct(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeProduct(input, this.config);
    if (report.validation.decision !== "fail") this.performance.productLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  localizeService(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeService(input, this.config);
    if (report.validation.decision !== "fail") this.performance.serviceLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  localizeStorefront(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeStorefront(input, this.config);
    if (report.validation.decision !== "fail") this.performance.storefrontLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  localizeBrand(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeBrand(input, this.config);
    if (report.validation.decision !== "fail") this.performance.brandLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  localizeMarketing(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeMarketing(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketingLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  localizeCustomerExperience(input: LocalizationInput = {}): LocRunReport {
    this.status = "localizing";
    const report = this.manager.localizeCustomerExperience(input, this.config);
    if (report.validation.decision !== "fail") this.performance.experienceLocalizations += 1;
    this.finalizeOperation(report);
    return report;
  }

  adaptRegion(input: LocalizationInput = {}): LocRunReport {
    this.status = "adapting";
    const report = this.manager.adaptRegion(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalAdaptations += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectGaps(input: LocalizationInput = {}): LocRunReport {
    this.status = "detecting";
    const report = this.manager.detectGaps(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.gapsDetected += report.localizationRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendLocalization(input: LocalizationInput = {}): LocRunReport {
    this.status = "recommending";
    const report = this.manager.recommendLocalization(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunLocDiagnosticsInput = {}): LocRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: LocRunReport): void {
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
    appendLocLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
