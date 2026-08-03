/** X4-02 — Country Intelligence Engine orchestration controller. */

import { appendCieLog } from "./cie-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CountryIntelligenceManager } from "./country-intelligence-manager.js";
import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  CiePerformanceStats,
  CieRunReport,
  ConnectCountryIntelligenceEngineInput,
  CountryAnalysisInput,
  EngineStatus,
  RunCieDiagnosticsInput,
} from "./types.js";

export class CountryIntelligenceController {
  private config: CountryIntelligenceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CieRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CiePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    countryEvaluations: 0,
    economicMonitors: 0,
    marketAnalyses: 0,
    readinessAssessments: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CountryIntelligenceManager,
    config: CountryIntelligenceEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCieLog({
      event: "engine_initialized",
      level: "info",
      details:
        "Country Intelligence Engine ready — structural signals only; never recommend unvalidated country data",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CountryIntelligenceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CountryIntelligenceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CieRunReport | null {
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

  getPerformance(): CiePerformanceStats {
    return { ...this.performance };
  }

  connectCountryIntelligenceEngine(
    input: ConnectCountryIntelligenceEngineInput = {},
  ): CieRunReport {
    if (!this.config.enabled) throw new Error("Country Intelligence Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCountryIntelligenceEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  evaluateCountry(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "evaluating";
    const report = this.manager.evaluateCountry(input, this.config);
    if (report.validation.decision !== "fail") this.performance.countryEvaluations += 1;
    this.finalizeOperation(report);
    return report;
  }

  monitorEconomicIndicators(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorEconomicIndicators(input, this.config);
    if (report.validation.decision !== "fail") this.performance.economicMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeMarket(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeMarket(input, this.config);
    if (report.validation.decision !== "fail") this.performance.marketAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  assessCommerceReadiness(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "analyzing";
    const report = this.manager.assessCommerceReadiness(input, this.config);
    if (report.validation.decision !== "fail") this.performance.readinessAssessments += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankCountries(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "ranking";
    const report = this.manager.rankCountries(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  recommendCountries(input: CountryAnalysisInput = {}): CieRunReport {
    this.status = "recommending";
    const report = this.manager.recommendCountries(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunCieDiagnosticsInput = {}): CieRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CieRunReport): void {
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
    appendCieLog({
      event: "engine_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
