/** X2-07 — Portfolio Risk Engine orchestration controller. */

import { appendPreLog } from "./pre-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { PortfolioRiskManager } from "./portfolio-risk-manager.js";
import type { PortfolioRiskEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeFinancialRiskInput,
  AnalyzeOperationalRiskInput,
  ConnectPortfolioRiskInput,
  DetectEmergingRisksInput,
  EngineStatus,
  MonitorRisksInput,
  RecommendRiskMitigationInput,
  RiskPerformanceStats,
  RiskRunReport,
  RunRiskDiagnosticsInput,
  ScorePortfolioRiskInput,
} from "./types.js";

export class PortfolioRiskController {
  private config: PortfolioRiskEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RiskRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RiskPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    monitoringRuns: 0,
    financialAnalyses: 0,
    operationalAnalyses: 0,
    scoringRuns: 0,
    emergingDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: PortfolioRiskManager,
    config: PortfolioRiskEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendPreLog({
      event: "framework_initialized",
      level: "info",
      details: "Portfolio Risk Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PortfolioRiskEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PortfolioRiskEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RiskRunReport | null {
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

  getPerformance(): RiskPerformanceStats {
    return { ...this.performance };
  }

  connectPortfolioRiskEngine(input: ConnectPortfolioRiskInput = {}): RiskRunReport {
    if (!this.config.enabled) throw new Error("Portfolio Risk Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectPortfolioRiskEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorRisks(input: MonitorRisksInput = {}): RiskRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.monitoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeFinancialRisk(input: AnalyzeFinancialRiskInput = {}): RiskRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeFinancialRisk(input, this.config);
    if (report.validation.decision !== "fail") this.performance.financialAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeOperationalRisk(input: AnalyzeOperationalRiskInput = {}): RiskRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeOperationalRisk(input, this.config);
    if (report.validation.decision !== "fail") this.performance.operationalAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  scorePortfolioRisk(input: ScorePortfolioRiskInput = {}): RiskRunReport {
    this.status = "analyzing";
    const report = this.manager.scorePortfolioRisk(input, this.config);
    if (report.validation.decision !== "fail") this.performance.scoringRuns += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectEmergingRisks(input: DetectEmergingRisksInput = {}): RiskRunReport {
    const report = this.manager.detectEmergingRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.emergingDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendRiskMitigationInput = {}): RiskRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunRiskDiagnosticsInput = {}): RiskRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: RiskRunReport): void {
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
    appendPreLog({
      event: "risk_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
