/** X4-10 — Executive Global Dashboard orchestration controller. */

import { appendEgdLog } from "./egd-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { ExecutiveGlobalDashboardManager } from "./executive-global-dashboard-manager.js";
import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import type {
  ConnectExecutiveGlobalDashboardInput,
  DashboardAnalysisInput,
  EngineStatus,
  EgdPerformanceStats,
  EgdRunReport,
  RunEgdDiagnosticsInput,
} from "./types.js";

export class ExecutiveGlobalDashboardController {
  private config: ExecutiveGlobalDashboardConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: EgdRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: EgdPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    worldwideOpsDisplays: 0,
    countryExpansionDisplays: 0,
    regionalPerformanceDisplays: 0,
    marketOpportunityDisplays: 0,
    logisticsDisplays: 0,
    complianceDisplays: 0,
    taxationDisplays: 0,
    localizationDisplays: 0,
    alertDisplays: 0,
    recommendationDisplays: 0,
    refreshOps: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: ExecutiveGlobalDashboardManager,
    config: ExecutiveGlobalDashboardConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendEgdLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Executive Global Dashboard ready — structural visibility only; never expose restricted information",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ExecutiveGlobalDashboardConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ExecutiveGlobalDashboardConfiguration): void {
    this.config = config;
  }

  getLatestReport(): EgdRunReport | null {
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

  getPerformance(): EgdPerformanceStats {
    return { ...this.performance };
  }

  connectExecutiveGlobalDashboard(
    input: ConnectExecutiveGlobalDashboardInput = {},
  ): EgdRunReport {
    if (!this.config.enabled) throw new Error("Executive Global Dashboard is disabled");
    this.status = "connecting";
    const report = this.manager.connectExecutiveGlobalDashboard(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  displayWorldwideOperations(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayWorldwideOperations(input, this.config);
    if (report.validation.decision !== "fail") this.performance.worldwideOpsDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayCountryExpansion(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayCountryExpansion(input, this.config);
    if (report.validation.decision !== "fail") this.performance.countryExpansionDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayRegionalPerformance(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayRegionalPerformance(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.regionalPerformanceDisplays += 1;
    }
    this.finalizeOperation(report);
    return report;
  }

  displayMarketOpportunities(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayMarketOpportunities(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketOpportunityDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayLogisticsPerformance(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayLogisticsPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.logisticsDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayComplianceStatus(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayComplianceStatus(input, this.config);
    if (report.validation.decision !== "fail") this.performance.complianceDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayTaxationStatus(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayTaxationStatus(input, this.config);
    if (report.validation.decision !== "fail") this.performance.taxationDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayLocalizationReadiness(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "aggregating";
    const report = this.manager.displayLocalizationReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.localizationDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayExecutiveAlerts(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "alerting";
    const report = this.manager.displayExecutiveAlerts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.alertDisplays += 1;
    this.finalizeOperation(report);
    return report;
  }

  displayGlobalRecommendations(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "recommending";
    const report = this.manager.displayGlobalRecommendations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationDisplays += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  refreshDashboard(input: DashboardAnalysisInput = {}): EgdRunReport {
    this.status = "refreshing";
    const report = this.manager.refreshDashboard(input, this.config);
    if (report.validation.decision !== "fail") this.performance.refreshOps += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunEgdDiagnosticsInput = {}): EgdRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: EgdRunReport): void {
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
    appendEgdLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
