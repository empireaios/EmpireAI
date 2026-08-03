/** X2-12 — Shared Customer Intelligence orchestration controller. */

import { appendSciLog } from "./sci-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { SharedCustomerIntelligenceManager } from "./shared-customer-intelligence-manager.js";
import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type {
  AnalyzeCustomerBehaviourInput,
  ConnectSharedCustomerIntelligenceInput,
  ConsolidateCustomerKnowledgeInput,
  CustomerIntelligencePerformanceStats,
  CustomerIntelligenceRunReport,
  DetectCrossSellInput,
  DetectCustomerRisksInput,
  EngineStatus,
  GenerateCustomerInsightsInput,
  RecommendCustomerIntelligenceInput,
  ResolveCustomerIdentityInput,
  RunCustomerIntelligenceDiagnosticsInput,
} from "./types.js";

export class SharedCustomerIntelligenceController {
  private config: SharedCustomerIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: CustomerIntelligenceRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: CustomerIntelligencePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    consolidationsRun: 0,
    identityResolutions: 0,
    behaviourAnalyses: 0,
    insightsGenerated: 0,
    crossSellDetections: 0,
    riskDetections: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: SharedCustomerIntelligenceManager,
    config: SharedCustomerIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendSciLog({
      event: "framework_initialized",
      level: "info",
      details: "Shared Customer Intelligence ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): SharedCustomerIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SharedCustomerIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): CustomerIntelligenceRunReport | null {
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

  getPerformance(): CustomerIntelligencePerformanceStats {
    return { ...this.performance };
  }

  connectSharedCustomerIntelligence(
    input: ConnectSharedCustomerIntelligenceInput = {},
  ): CustomerIntelligenceRunReport {
    if (!this.config.enabled) throw new Error("Shared Customer Intelligence is disabled");
    this.status = "connecting";
    const report = this.manager.connectSharedCustomerIntelligence(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  consolidateCustomerKnowledge(
    input: ConsolidateCustomerKnowledgeInput,
  ): CustomerIntelligenceRunReport {
    this.status = "synchronizing";
    const report = this.manager.consolidateCustomerKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.consolidationsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  resolveCustomerIdentity(input: ResolveCustomerIdentityInput): CustomerIntelligenceRunReport {
    this.status = "synchronizing";
    const report = this.manager.resolveCustomerIdentity(input, this.config);
    if (report.validation.decision !== "fail") this.performance.identityResolutions += 1;
    this.finalizeOperation(report);
    return report;
  }

  analyzeCustomerBehaviour(input: AnalyzeCustomerBehaviourInput): CustomerIntelligenceRunReport {
    this.status = "analyzing";
    const report = this.manager.analyzeCustomerBehaviour(input, this.config);
    if (report.validation.decision !== "fail") this.performance.behaviourAnalyses += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateInsights(input: GenerateCustomerInsightsInput = {}): CustomerIntelligenceRunReport {
    this.status = "analyzing";
    const report = this.manager.generateInsights(input, this.config);
    if (report.validation.decision !== "fail") {
      this.performance.insightsGenerated += report.intelligenceRecords.length;
    }
    this.finalizeOperation(report);
    return report;
  }

  detectCrossSell(input: DetectCrossSellInput = {}): CustomerIntelligenceRunReport {
    const report = this.manager.detectCrossSell(input, this.config);
    if (report.validation.decision !== "fail") this.performance.crossSellDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectCustomerRisks(input: DetectCustomerRisksInput = {}): CustomerIntelligenceRunReport {
    const report = this.manager.detectCustomerRisks(input, this.config);
    if (report.validation.decision !== "fail") this.performance.riskDetections += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(
    input: RecommendCustomerIntelligenceInput = {},
  ): CustomerIntelligenceRunReport {
    this.status = "recommending";
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(
    input: RunCustomerIntelligenceDiagnosticsInput = {},
  ): CustomerIntelligenceRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: CustomerIntelligenceRunReport): void {
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
    appendSciLog({
      event: "customer_intelligence_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
