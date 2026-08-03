/** X2-10 — Portfolio Intelligence Certification Controller. */

import { appendPicLog } from "./pic-logging.js";
import { PortfolioIntelligenceCertificationManager } from "./portfolio-intelligence-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PortfolioIntelligenceCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationPerformanceStats,
  CertificationRunReport,
  CertifyPortfolioIntelligenceInput,
  ConnectPortfolioIntelligenceCertifiedInput,
  EngineStatus,
} from "./types.js";

export class PortfolioIntelligenceCertificationController {
  private config: PortfolioIntelligenceCertifiedConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CertificationRunReport | null = null;
  private readonly manager: PortfolioIntelligenceCertificationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CertificationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    certificationsRun: 0,
    moduleValidationsRun: 0,
    endToEndRuns: 0,
    reportRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: PortfolioIntelligenceCertificationManager,
    config: PortfolioIntelligenceCertifiedConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPicLog({
      event: "engine_initialization",
      level: "info",
      details: "Portfolio Intelligence Certified ready (X2-10)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioIntelligenceCertifiedConfiguration {
    return { ...this.config, certificationScope: [...this.config.certificationScope] };
  }

  updateConfiguration(config: PortfolioIntelligenceCertifiedConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CertificationRunReport | null {
    return this.latestReport;
  }

  getManager(): PortfolioIntelligenceCertificationManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): CertificationPerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioIntelligenceCertified(
    input: ConnectPortfolioIntelligenceCertifiedInput = {},
  ): CertificationRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Intelligence Certified is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioIntelligenceCertified(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  certifyPortfolioIntelligence(
    input: CertifyPortfolioIntelligenceInput = {},
  ): CertificationRunReport {
    this.status = "certifying";
    this.performance.certificationsRun += 1;
    const report = this.manager.certifyPortfolioIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateEnterprisePortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateEnterprisePortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCompanyRegistry(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateCompanyRegistry(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validatePortfolioAnalytics(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validatePortfolioAnalytics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateKnowledgeSharing(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateKnowledgeSharing(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCapitalDistribution(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateCapitalDistribution(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateExecutiveDashboard(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateExecutiveDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validatePortfolioRisk(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validatePortfolioRisk(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validatePortfolioBalance(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validatePortfolioBalance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateBusinessHealth(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateBusinessHealth(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  runEndToEndPortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.endToEndRuns += 1;
    const report = this.manager.runEndToEndPortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.reportRuns += 1;
    const report = this.manager.generateCertificationReport(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CertificationRunReport): void {
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
    appendPicLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
