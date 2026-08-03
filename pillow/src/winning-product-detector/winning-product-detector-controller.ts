/** X3-02 — Winning Product Detector orchestration controller. */

import { appendWpdLog } from "./wpd-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { WinningProductDetectorManager } from "./winning-product-detector-manager.js";
import type { WinningProductDetectorConfiguration } from "./configuration.js";
import type {
  ConnectWinningProductDetectorInput,
  EngineStatus,
  ProductAnalysisInput,
  RunWpdDiagnosticsInput,
  WpdPerformanceStats,
  WpdRunReport,
} from "./types.js";

export class WinningProductDetectorController {
  private config: WinningProductDetectorConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: WpdRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: WpdPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    performanceMonitors: 0,
    velocityAnalyses: 0,
    demandAnalyses: 0,
    trendAnalyses: 0,
    breakoutDetections: 0,
    decliningDetections: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: WinningProductDetectorManager,
    config: WinningProductDetectorConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendWpdLog({
      event: "detector_initialized",
      level: "info",
      details:
        "Winning Product Detector ready — structural signals only; performance data never manipulated",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): WinningProductDetectorConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: WinningProductDetectorConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WpdRunReport | null {
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

  getPerformance(): WpdPerformanceStats {
    return { ...this.performance };
  }

  connectWinningProductDetector(
    input: ConnectWinningProductDetectorInput = {},
  ): WpdRunReport {
    if (!this.config.enabled) throw new Error("Winning Product Detector is disabled");
    this.status = "connecting";
    const report = this.manager.connectWinningProductDetector(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  monitorProductPerformance(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "monitoring";
    const report = this.manager.monitorProductPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceMonitors += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeSalesVelocity(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeSalesVelocity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.velocityAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeDemand(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeDemand(input, this.config);
    if (report.validation.decision !== "fail") this.performance.demandAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeTrends(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeTrends(input, this.config);
    if (report.validation.decision !== "fail") this.performance.trendAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectBreakouts(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "detecting";
    const report = this.manager.detectBreakouts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.breakoutDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectDeclining(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "detecting";
    const report = this.manager.detectDeclining(input, this.config);
    if (report.validation.decision !== "fail") this.performance.decliningDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  rankProducts(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "ranking";
    const report = this.manager.rankProducts(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: ProductAnalysisInput = {}): WpdRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.recommendationsGenerated += report.recommendations.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunWpdDiagnosticsInput = {}): WpdRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: WpdRunReport): void {
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
    appendWpdLog({
      event: "detector_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
