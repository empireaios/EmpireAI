/** X2-04 — Cross-Business Knowledge Engine orchestration controller. */

import { appendCbkLog } from "./cbk-logging.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import { CrossBusinessKnowledgeManager } from "./cross-business-knowledge-manager.js";
import type { CrossBusinessKnowledgeEngineConfiguration } from "./configuration.js";
import type {
  ClassifyKnowledgeInput,
  CollectKnowledgeInput,
  ConnectCrossBusinessKnowledgeInput,
  DetectDuplicateKnowledgeInput,
  EngineStatus,
  KnowledgePerformanceStats,
  KnowledgeRunReport,
  RankKnowledgeInput,
  RecommendKnowledgeInput,
  RunKnowledgeDiagnosticsInput,
  ShareKnowledgeInput,
} from "./types.js";

export class CrossBusinessKnowledgeController {
  private config: CrossBusinessKnowledgeEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: KnowledgeRunReport | null = null;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: KnowledgePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    knowledgeCollected: 0,
    classifications: 0,
    sharesCompleted: 0,
    duplicatesDetected: 0,
    rankingsRun: 0,
    recommendationsGenerated: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(
    private readonly manager: CrossBusinessKnowledgeManager,
    config: CrossBusinessKnowledgeEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCbkLog({
      event: "framework_initialized",
      level: "info",
      details: "Cross-Business Knowledge Engine ready",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CrossBusinessKnowledgeEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CrossBusinessKnowledgeEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): KnowledgeRunReport | null {
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

  getPerformance(): KnowledgePerformanceStats {
    return { ...this.performance };
  }

  connectCrossBusinessKnowledgeEngine(
    input: ConnectCrossBusinessKnowledgeInput = {},
  ): KnowledgeRunReport {
    if (!this.config.enabled) throw new Error("Cross-Business Knowledge Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCrossBusinessKnowledgeEngine(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  collectKnowledge(input: CollectKnowledgeInput): KnowledgeRunReport {
    this.status = "collecting";
    const report = this.manager.collectKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.knowledgeCollected += 1;
    this.finalizeOperation(report);
    return report;
  }

  classifyKnowledge(input: ClassifyKnowledgeInput): KnowledgeRunReport {
    this.status = "classifying";
    const report = this.manager.classifyKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.classifications += 1;
    this.finalizeOperation(report);
    return report;
  }

  shareKnowledge(input: ShareKnowledgeInput): KnowledgeRunReport {
    this.status = "sharing";
    const report = this.manager.shareKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.sharesCompleted += 1;
    this.finalizeOperation(report);
    return report;
  }

  detectDuplicates(input: DetectDuplicateKnowledgeInput = {}): KnowledgeRunReport {
    const report = this.manager.detectDuplicates(input, this.config);
    this.performance.duplicatesDetected += report.knowledgeRecords.length;
    this.finalizeOperation(report);
    return report;
  }

  rankKnowledge(input: RankKnowledgeInput = {}): KnowledgeRunReport {
    const report = this.manager.rankKnowledge(input, this.config);
    if (report.validation.decision !== "fail") this.performance.rankingsRun += 1;
    this.finalizeOperation(report);
    return report;
  }

  generateRecommendations(input: RecommendKnowledgeInput = {}): KnowledgeRunReport {
    const report = this.manager.generateRecommendations(input, this.config);
    this.performance.recommendationsGenerated += report.recommendations.length;
    this.finalizeOperation(report);
    return report;
  }

  runDiagnostics(input: RunKnowledgeDiagnosticsInput = {}): KnowledgeRunReport {
    const report = this.manager.runDiagnostics(input, this.config);
    this.finalizeOperation(report);
    return report;
  }

  private finalizeOperation(report: KnowledgeRunReport): void {
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
    appendCbkLog({
      event: "knowledge_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${report.action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
