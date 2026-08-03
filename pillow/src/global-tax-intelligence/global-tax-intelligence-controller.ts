/** X4-07 — Global Tax Intelligence orchestration controller. */

import { appendGtiLog } from "./gti-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { GlobalTaxIntelligenceManager } from "./global-tax-intelligence-manager.js";
import type { GlobalTaxIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectGlobalTaxIntelligenceInput,
  EngineStatus,
  GtiPerformanceStats,
  GtiRunReport,
  RunGtiDiagnosticsInput,
  TaxAnalysisInput,
} from "./types.js";

export class GlobalTaxIntelligenceController {
  private config: GlobalTaxIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: GtiRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: GtiPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    countryRuleOps: 0,
    regulationMonitors: 0,
    indirectOps: 0,
    directOps: 0,
    crossBorderOps: 0,
    obligationEstimates: 0,
    complianceRiskDetections: 0,
    optimizationDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: GlobalTaxIntelligenceManager,
    config: GlobalTaxIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendGtiLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Global Tax Intelligence ready — structural signals only; never authoritative legal advice",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): GlobalTaxIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: GlobalTaxIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): GtiRunReport | null {
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

  getPerformance(): GtiPerformanceStats {
    return { ...this.performance };
  }

  connectGlobalTaxIntelligence(
    input: ConnectGlobalTaxIntelligenceInput = {},
  ): GtiRunReport {
    if (!this.config.enabled) throw new Error("Global Tax Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectGlobalTaxIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageCountryTaxRules(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.manageCountryTaxRules(input, this.config);
    if (report.validation.decision !== "fail") this.performance.countryRuleOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorTaxRegulationUpdates(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorTaxRegulationUpdates(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regulationMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageIndirectTaxes(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.manageIndirectTaxes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.indirectOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageDirectTaxes(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.manageDirectTaxes(input, this.config);
    if (report.validation.decision !== "fail") this.performance.directOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageCrossBorder(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.manageCrossBorder(input, this.config);
    if (report.validation.decision !== "fail") this.performance.crossBorderOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  estimateTaxObligation(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "calculating";
    const report = this.manager.estimateTaxObligation(input, this.config);
    if (report.validation.decision !== "fail") this.performance.obligationEstimates += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectComplianceRisks(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.detectComplianceRisks(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.complianceRiskDetections += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectOptimizationOpportunities(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "analyzing";
    const report = this.manager.detectOptimizationOpportunities(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.optimizationDetections += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  recommendTax(input: TaxAnalysisInput = {}): GtiRunReport {
    this.status = "recommending";
    const report = this.manager.recommendTax(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunGtiDiagnosticsInput = {}): GtiRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: GtiRunReport): void {
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
    appendGtiLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
