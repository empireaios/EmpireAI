/** X4-13 — Global Talent Intelligence orchestration controller. */

import { appendTalLog } from "./tal-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { GlobalTalentManager } from "./global-talent-manager.js";
import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectGlobalTalentIntelligenceInput,
  EngineStatus,
  RunTalDiagnosticsInput,
  TalPerformanceStats,
  TalRunReport,
  WorkforceAnalysisInput,
} from "./types.js";

export class GlobalTalentController {
  private config: GlobalTalentIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: TalRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: TalPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    availabilityMonitors: 0,
    regionalTalentOps: 0,
    capabilityMonitors: 0,
    performanceMonitors: 0,
    costMonitors: 0,
    utilizationMonitors: 0,
    shortageDetections: 0,
    opportunityDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: GlobalTalentManager,
    config: GlobalTalentIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendTalLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Global Talent Intelligence ready — structural signals only; never make workforce decisions using unvalidated intelligence",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GlobalTalentIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GlobalTalentIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): TalRunReport | null {
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

  getPerformance(): TalPerformanceStats {
    return { ...this.performance };
  }

  connectGlobalTalentIntelligence(input: ConnectGlobalTalentIntelligenceInput = {}): TalRunReport {
    if (!this.config.enabled) throw new Error("Global Talent Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectGlobalTalentIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorGlobalWorkforceAvailability(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorGlobalWorkforceAvailability(input, this.config);
    if (report.validation.decision !== "fail") this.performance.availabilityMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegionalTalentMarkets(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegionalTalentMarkets(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regionalTalentOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceCapabilities(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "evaluating";
    const report = this.manager.monitorWorkforceCapabilities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.capabilityMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforcePerformance(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforcePerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceCosts(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceCosts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.costMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorWorkforceUtilization(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorWorkforceUtilization(input, this.config);
    if (report.validation.decision !== "fail") this.performance.utilizationMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectWorkforceShortages(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "analyzing";
    const report = this.manager.detectWorkforceShortages(input, this.config);
    if (report.validation.decision !== "fail") this.performance.shortageDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectWorkforceOpportunities(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "analyzing";
    const report = this.manager.detectWorkforceOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.opportunityDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendWorkforce(input: WorkforceAnalysisInput = {}): TalRunReport {
    this.status = "recommending";
    const report = this.manager.recommendWorkforce(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunTalDiagnosticsInput = {}): TalRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: TalRunReport): void {
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
    appendTalLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
