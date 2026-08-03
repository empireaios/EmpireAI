/** X2-21 — Portfolio Certification Controller. */

import { appendPtcLog } from "./ptc-logging.js";
import { PortfolioCertificationManager } from "./portfolio-certification-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PortfolioCertifiedConfiguration } from "./configuration.js";
import type {
  CertificationActionInput,
  CertificationPerformanceStats,
  CertificationRunReport,
  CertifyPortfolioInput,
  ConnectPortfolioCertifiedInput,
  EngineStatus,
} from "./types.js";

export class PortfolioCertificationController {
  private config: PortfolioCertifiedConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CertificationRunReport | null = null;
  private readonly manager: PortfolioCertificationManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CertificationPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    certificationsRun: 0,
    moduleValidationsRun: 0,
    crossModuleRuns: 0,
    endToEndRuns: 0,
    governanceRuns: 0,
    reportRuns: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    manager: PortfolioCertificationManager,
    config: PortfolioCertifiedConfiguration,
  ) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPtcLog({
      event: "engine_initialization",
      level: "info",
      details: "Portfolio Certified ready (X2-21) — safe test mode",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioCertifiedConfiguration {
    return { ...this.config, certificationScope: [...this.config.certificationScope] };
  }

  updateConfiguration(config: PortfolioCertifiedConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CertificationRunReport | null {
    return this.latestReport;
  }

  getManager(): PortfolioCertificationManager {
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

  connectPortfolioCertified(input: ConnectPortfolioCertifiedInput = {}): CertificationRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Certified is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioCertified(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  certifyPortfolio(input: CertifyPortfolioInput = {}): CertificationRunReport {
    this.status = "certifying";
    this.performance.certificationsRun += 1;
    this.performance.moduleValidationsRun += 1;
    const report = this.manager.certifyPortfolio(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateCrossModule(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.crossModuleRuns += 1;
    const report = this.manager.validateCrossModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateEndToEnd(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.endToEndRuns += 1;
    const report = this.manager.validateEndToEnd(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  validateExecutiveGovernance(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.governanceRuns += 1;
    const report = this.manager.validateExecutiveGovernance(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  generateCertificationReport(input: CertificationActionInput = {}): CertificationRunReport {
    this.performance.reportRuns += 1;
    const report = this.manager.generateCertificationReport(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: CertificationActionInput = {}): CertificationRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CertificationRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;
    this.performance.peakOperationDurationMs = Math.max(
      this.performance.peakOperationDurationMs,
      duration,
    );
    const prior = this.performance.totalOperations - 1;
    this.performance.averageOperationDurationMs =
      prior <= 0
        ? duration
        : Math.round(
            (this.performance.averageOperationDurationMs * prior + duration) /
              this.performance.totalOperations,
          );

    this.healthMonitor.recordOperation(report.validation.decision);
    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      const recovered = this.recoveryManager.recordFailure(
        report.validation.errors.join("; ") || "certification operation failed",
        this.config,
      );
      if (recovered) this.performance.retryAttempts += 1;
      this.status = "failed";
    } else {
      this.performance.successfulOperations += 1;
      this.recoveryManager.recordSuccess();
      this.status = "active";
    }
  }
}
