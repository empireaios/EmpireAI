/** X2-13 — Shared Supplier Intelligence orchestration controller. */

import { appendSsiLog } from "./ssi-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SharedSupplierIntelligenceManager } from "./shared-supplier-intelligence-manager.js";
import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type {
  ConnectSharedSupplierIntelligenceInput,
  ConsolidateSupplierKnowledgeInput,
  DetectSupplierDuplicatesInput,
  DetectSupplierRisksInput,
  EngineStatus,
  RecommendSupplierInput,
  RunSupplierIntelligenceDiagnosticsInput,
  ShareSupplierIntelligenceInput,
  SupplierIntelligencePerformanceStats,
  SupplierIntelligenceRunReport,
  TrackSupplierPerformanceInput,
} from "./types.js";

export class SharedSupplierIntelligenceController {
  private config: SharedSupplierIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SupplierIntelligenceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SupplierIntelligencePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    consolidationsRun: 0,
    performanceAnalyses: 0,
    riskDetections: 0,
    duplicateDetections: 0,
    recommendationsGenerated: 0,
    shareOperations: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: SharedSupplierIntelligenceManager,
    config: SharedSupplierIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSsiLog({
      event: "framework_initialized",
      level: "info",
      details: "Shared Supplier Intelligence ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SharedSupplierIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SharedSupplierIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SupplierIntelligenceRunReport | null {
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

  getPerformance(): SupplierIntelligencePerformanceStats {
    return { ...this.performance };
  }

  connectSharedSupplierIntelligence(
    input: ConnectSharedSupplierIntelligenceInput = {},
  ): SupplierIntelligenceRunReport {
    if (!this.config.enabled) throw new Error("Shared Supplier Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectSharedSupplierIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  consolidateSupplierKnowledge(
    input: ConsolidateSupplierKnowledgeInput,
  ): SupplierIntelligenceRunReport {
    this.status = "synchronizing";
    const report = this.manager.consolidateSupplierKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.consolidationsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  trackSupplierPerformance(input: TrackSupplierPerformanceInput): SupplierIntelligenceRunReport {
    this.status = "analyzing";
    const report = this.manager.trackSupplierPerformance(input, this.config);
    if (report.validation.decision !== "fail") this.performance.performanceAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectSupplierRisks(input: DetectSupplierRisksInput = {}): SupplierIntelligenceRunReport {
    const report = this.manager.detectSupplierRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectSupplierDuplicates(
    input: DetectSupplierDuplicatesInput = {},
  ): SupplierIntelligenceRunReport {
    const report = this.manager.detectSupplierDuplicates(input, this.config);
    if (report.validation.decision !== "fail") this.performance.duplicateDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendSupplierInput = {}): SupplierIntelligenceRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  shareSupplierIntelligence(input: ShareSupplierIntelligenceInput): SupplierIntelligenceRunReport {
    this.status = "synchronizing";
    const report = this.manager.shareSupplierIntelligence(input, this.config);
    if (report.validation.decision !== "fail") this.performance.shareOperations += 1;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(
    input: RunSupplierIntelligenceDiagnosticsInput = {},
  ): SupplierIntelligenceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: SupplierIntelligenceRunReport): void {
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
    appendSsiLog({
      event: "supplier_intelligence_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
