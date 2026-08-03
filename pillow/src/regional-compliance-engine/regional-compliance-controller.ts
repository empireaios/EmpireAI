/** X4-06 — Regional Compliance Engine orchestration controller. */

import { appendRceLog } from "./rce-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { RegionalComplianceManager } from "./regional-compliance-manager.js";
import type { RegionalComplianceEngineConfiguration } from "./configuration.js";
import type {
  ComplianceAnalysisInput,
  ConnectRegionalComplianceEngineInput,
  EngineStatus,
  RcePerformanceStats,
  RceRunReport,
  RunRceDiagnosticsInput,
} from "./types.js";

export class RegionalComplianceController {
  private config: RegionalComplianceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RcePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    countryRequirementOps: 0,
    regulatoryMonitors: 0,
    businessRuleOps: 0,
    operationalAssessments: 0,
    marketplaceAssessments: 0,
    dataProtectionAssessments: 0,
    violationDetections: 0,
    riskAssessments: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: RegionalComplianceManager,
    config: RegionalComplianceEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRceLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Regional Compliance Engine ready — structural signals only; never falsely certify compliance",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RegionalComplianceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: RegionalComplianceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RceRunReport | null {
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

  getPerformance(): RcePerformanceStats {
    return { ...this.performance };
  }

  connectRegionalComplianceEngine(
    input: ConnectRegionalComplianceEngineInput = {},
  ): RceRunReport {
    if (!this.config.enabled) throw new Error("Regional Compliance Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectRegionalComplianceEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  manageCountryRequirements(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "assessing";
    const report = this.manager.manageCountryRequirements(input, this.config);
    if (report.validation.decision !== "fail") this.performance.countryRequirementOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorRegulatoryChanges(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRegulatoryChanges(input, this.config);
    if (report.validation.decision !== "fail") this.performance.regulatoryMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  manageBusinessRules(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "assessing";
    const report = this.manager.manageBusinessRules(input, this.config);
    if (report.validation.decision !== "fail") this.performance.businessRuleOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessOperational(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "assessing";
    const report = this.manager.assessOperational(input, this.config);
    if (report.validation.decision !== "fail") this.performance.operationalAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessMarketplace(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "assessing";
    const report = this.manager.assessMarketplace(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketplaceAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessDataProtection(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "assessing";
    const report = this.manager.assessDataProtection(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.dataProtectionAssessments += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectViolations(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "analyzing";
    const report = this.manager.detectViolations(input, this.config);
    if (report.validation.decision !== "fail") this.performance.violationDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessRisks(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "analyzing";
    const report = this.manager.assessRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendCompliance(input: ComplianceAnalysisInput = {}): RceRunReport {
    this.status = "recommending";
    const report = this.manager.recommendCompliance(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRceDiagnosticsInput = {}): RceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RceRunReport): void {
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
    appendRceLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
