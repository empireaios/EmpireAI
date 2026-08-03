/** X4-11 — Global Brand Management orchestration controller. */

import { appendGbmLog } from "./gbm-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { GlobalBrandManager } from "./global-brand-manager.js";
import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import type {
  BrandAnalysisInput,
  ConnectGlobalBrandManagementInput,
  EngineStatus,
  GbmPerformanceStats,
  GbmRunReport,
  RunGbmDiagnosticsInput,
} from "./types.js";

export class GlobalBrandController {
  private config: GlobalBrandManagementConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: GbmRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: GbmPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    identityOps: 0,
    regionalAdaptationOps: 0,
    consistencyOps: 0,
    performanceMonitors: 0,
    reputationMonitors: 0,
    complianceMonitors: 0,
    inconsistencyDetections: 0,
    reputationRiskDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: GlobalBrandManager,
    config: GlobalBrandManagementConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGbmLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Global Brand Management ready — structural signals only; never modify protected assets without authorization",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GlobalBrandManagementConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GlobalBrandManagementConfiguration): void {
    this.config = config;
  }

  getLatestReport(): GbmRunReport | null {
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

  getPerformance(): GbmPerformanceStats {
    return { ...this.performance };
  }

  connectGlobalBrandManagement(input: ConnectGlobalBrandManagementInput = {}): GbmRunReport {
    if (!this.config.enabled) throw new Error("Global Brand Management is disabled");
    this.status = "connecting";
    const report = this.manager.connectGlobalBrandManagement(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageWorldwideIdentity(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "governing";
    const report = this.manager.manageWorldwideIdentity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.identityOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageRegionalAdaptations(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "governing";
    const report = this.manager.manageRegionalAdaptations(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalAdaptationOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageBrandConsistency(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "governing";
    const report = this.manager.manageBrandConsistency(input, this.config);
    if (report.validation.decision !== "fail") this.performance.consistencyOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorBrandPerformance(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorBrandPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorBrandReputation(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorBrandReputation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.reputationMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorBrandCompliance(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorBrandCompliance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.complianceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectBrandInconsistencies(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "analyzing";
    const report = this.manager.detectBrandInconsistencies(input, this.config);
    if (report.validation.decision !== "fail") this.performance.inconsistencyDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectReputationRisks(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "analyzing";
    const report = this.manager.detectReputationRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.reputationRiskDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendBrand(input: BrandAnalysisInput = {}): GbmRunReport {
    this.status = "recommending";
    const report = this.manager.recommendBrand(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunGbmDiagnosticsInput = {}): GbmRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: GbmRunReport): void {
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
    appendGbmLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
