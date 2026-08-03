/** X1-15 — Company Factory Certification Controller. */

import { appendCfcLog } from "./cfc-logging.js";
import { CompanyFactoryCertificationManager } from "./company-factory-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CompanyFactoryCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationPerformanceStats,
  CertificationRunReport,
  CertifyCompanyFactoryInput,
  ConnectCompanyFactoryCertifiedInput,
  EngineStatus,
} from "./types.js";

export class CompanyFactoryCertificationController {
  private config: CompanyFactoryCertifiedConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CertificationRunReport | null = null;
  private readonly manager: CompanyFactoryCertificationManager;
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
    manager: CompanyFactoryCertificationManager,
    config: CompanyFactoryCertifiedConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCfcLog({
      event: "engine_initialization",
      level: "info",
      details: "Company Factory Certified ready (X1-15)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CompanyFactoryCertifiedConfiguration {
    return { ...this.config, certificationScope: [...this.config.certificationScope] };
  }

  updateConfiguration(config: CompanyFactoryCertifiedConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CertificationRunReport | null {
    return this.latestReport;
  }

  getManager(): CompanyFactoryCertificationManager {
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

  connectCompanyFactoryCertified(
    input: ConnectCompanyFactoryCertifiedInput = {},
  ): CertificationRunReport {
    if (!this.config.enabled) throw new Error("Company Factory Certified is disabled");
    this.status = "connecting";
    const report = this.manager.connectCompanyFactoryCertified(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  certifyCompanyFactory(input: CertifyCompanyFactoryInput = {}): CertificationRunReport {
    this.status = "certifying";
    this.performance.certificationsRun += 1;
    const report = this.manager.certifyCompanyFactory(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCompanyFramework(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateCompanyFramework(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateOpportunityDiscovery(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateOpportunityDiscovery(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateMarketValidation(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateMarketValidation(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateBusinessModel(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateBusinessModel(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateBrand(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateBrand(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateStore(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateStore(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateProductPortfolio(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateProductPortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateLaunch(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.validateLaunch(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  runEndToEndCompanyCreation(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.endToEndRuns += 1;
    const report = this.manager.runEndToEndCompanyCreation(input, this.config);
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
    appendCfcLog({
      event: "operation_complete",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
