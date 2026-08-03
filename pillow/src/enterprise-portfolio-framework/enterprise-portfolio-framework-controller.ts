/** X2-01 — Enterprise Portfolio Framework orchestration controller. */

import { appendEpfLog } from "./epf-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { EnterprisePortfolioFrameworkManager } from "./enterprise-portfolio-framework-manager.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";
import type {
  AbstractPortfolioDataInput,
  EngineStatus,
  PortfolioFrameworkPerformanceStats,
  PortfolioFrameworkRunReport,
  RegisterPortfolioCompanyInput,
  RegisterPortfolioModuleInput,
  RoutePortfolioEventInput,
  RunPortfolioDiagnosticsInput,
} from "./types.js";

export class EnterprisePortfolioFrameworkController {
  private config: EnterprisePortfolioFrameworkConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PortfolioFrameworkRunReport | null = null;
  private readonly manager = new EnterprisePortfolioFrameworkManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PortfolioFrameworkPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    totalEventsRouted: 0,
    companiesRegistered: 0,
    dataAbstractions: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(config: EnterprisePortfolioFrameworkConfiguration) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEpfLog({
      event: "framework_initialized",
      level: "info",
      details: "Enterprise Portfolio Framework ready",
    });
  }

  stop(): void {
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): EnterprisePortfolioFrameworkConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: EnterprisePortfolioFrameworkConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PortfolioFrameworkRunReport | null {
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

  getPerformance(): PortfolioFrameworkPerformanceStats {
    return { ...this.performance };
  }

  registerPortfolioModule(input: RegisterPortfolioModuleInput): PortfolioFrameworkRunReport {
    if (!this.config.enabled) throw new Error("Enterprise Portfolio Framework is disabled");
    this.status = "registering";
    appendEpfLog({
      event: "portfolio_module_registration_start",
      level: "info",
      details: input.definition.portfolioModuleIdentifier,
    });
    const report = this.manager.registerPortfolioModule(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  registerCompany(input: RegisterPortfolioCompanyInput): PortfolioFrameworkRunReport {
    if (!this.config.enabled) throw new Error("Enterprise Portfolio Framework is disabled");
    const report = this.manager.registerCompany(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.companiesRegistered += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  activatePortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    const report = this.manager.activatePortfolioModule(portfolioModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  suspendPortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    const report = this.manager.suspendPortfolioModule(portfolioModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  shutdownPortfolioModule(portfolioModuleIdentifier: string): PortfolioFrameworkRunReport {
    this.status = "shutting_down";
    const report = this.manager.shutdownPortfolioModule(portfolioModuleIdentifier, this.config);
    this.finalizeOperation(report);
    return report;
  }

  routePortfolioEvent(input: RoutePortfolioEventInput): PortfolioFrameworkRunReport {
    const report = this.manager.routePortfolioEvent(input, this.config);
    this.performance.totalEventsRouted += 1;
    this.finalizeOperation(report);
    return report;
  }

  abstractPortfolioData(input: AbstractPortfolioDataInput): PortfolioFrameworkRunReport {
    const report = this.manager.abstractPortfolioData(input, this.config);
    this.performance.dataAbstractions += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunPortfolioDiagnosticsInput = {}): PortfolioFrameworkRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: PortfolioFrameworkRunReport): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `Operation failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendEpfLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
