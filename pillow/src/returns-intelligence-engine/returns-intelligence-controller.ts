/** R4-13 — Returns Intelligence Controller. */

import { appendRieLog } from "./rie-logging.js";
import { ReturnsIntelligenceManager } from "./returns-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ReturnsIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeReturnHistoryInput,
  ConnectReturnsIntelligenceEngineInput,
  CoordinateCustomerCommunicationsInput,
  DetectAbnormalReturnBehaviorInput,
  DetectRepeatReturnPatternsInput,
  DetectReturnFailuresInput,
  EngineStatus,
  EvaluateReturnEligibilityInput,
  GenerateReturnInsightsInput,
  ReceiveReturnRequestInput,
  RecommendReturnDecisionInput,
  ReturnsIntelligencePerformanceStats,
  ReturnsIntelligenceRunReport,
  TrackReturnLifecycleInput,
} from "./types.js";

export class ReturnsIntelligenceController {
  private config: ReturnsIntelligenceEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ReturnsIntelligenceRunReport | null = null;
  private readonly manager: ReturnsIntelligenceManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ReturnsIntelligencePerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    requestsReceived: 0,
    eligibilityEvaluations: 0,
    historyAnalyses: 0,
    abnormalDetected: 0,
    repeatPatternsDetected: 0,
    recommendationsGenerated: 0,
    lifecycleTracked: 0,
    communicationsCoordinated: 0,
    insightsGenerated: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: ReturnsIntelligenceManager, config: ReturnsIntelligenceEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendRieLog({
      event: "engine_initialization",
      level: "info",
      details: "Returns Intelligence Engine ready (R4-13)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ReturnsIntelligenceEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ReturnsIntelligenceEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ReturnsIntelligenceRunReport | null {
    return this.latestReport;
  }

  getManager(): ReturnsIntelligenceManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): ReturnsIntelligencePerformanceStats {
    return { ...this.performance };
  }

  connectReturnsIntelligenceEngine(
    input: ConnectReturnsIntelligenceEngineInput = {},
  ): ReturnsIntelligenceRunReport {
    if (!this.config.enabled) throw new Error("Returns Intelligence Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectReturnsIntelligenceEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  receiveReturnRequest(input: ReceiveReturnRequestInput): ReturnsIntelligenceRunReport {
    this.performance.requestsReceived += 1;
    const report = this.manager.receiveReturnRequest(input, this.config);
    this.finalizeOperation(report, "receive_request");
    return report;
  }

  evaluateReturnEligibility(input: EvaluateReturnEligibilityInput): ReturnsIntelligenceRunReport {
    this.performance.eligibilityEvaluations += 1;
    const report = this.manager.evaluateReturnEligibility(input, this.config);
    this.finalizeOperation(report, "evaluate_eligibility");
    return report;
  }

  analyzeReturnHistory(input: AnalyzeReturnHistoryInput): ReturnsIntelligenceRunReport {
    this.performance.historyAnalyses += 1;
    const report = this.manager.analyzeReturnHistory(input, this.config);
    this.finalizeOperation(report, "analyze_history");
    return report;
  }

  detectAbnormalReturnBehavior(
    input: DetectAbnormalReturnBehaviorInput = {},
  ): ReturnsIntelligenceRunReport {
    const report = this.manager.detectAbnormalReturnBehavior(input, this.config);
    this.performance.abnormalDetected += report.returnIntelligenceRecords.length;
    this.finalizeOperation(report, "detect_abnormal");
    return report;
  }

  detectRepeatReturnPatterns(
    input: DetectRepeatReturnPatternsInput = {},
  ): ReturnsIntelligenceRunReport {
    const report = this.manager.detectRepeatReturnPatterns(input, this.config);
    this.performance.repeatPatternsDetected += report.returnIntelligenceRecords.length;
    this.finalizeOperation(report, "detect_repeat");
    return report;
  }

  recommendReturnDecision(input: RecommendReturnDecisionInput): ReturnsIntelligenceRunReport {
    this.performance.recommendationsGenerated += 1;
    const report = this.manager.recommendReturnDecision(input, this.config);
    this.finalizeOperation(report, "recommend_decision");
    return report;
  }

  trackReturnLifecycle(input: TrackReturnLifecycleInput): ReturnsIntelligenceRunReport {
    this.performance.lifecycleTracked += 1;
    const report = this.manager.trackReturnLifecycle(input, this.config);
    this.finalizeOperation(report, "track_lifecycle");
    return report;
  }

  coordinateCustomerCommunications(
    input: CoordinateCustomerCommunicationsInput,
  ): ReturnsIntelligenceRunReport {
    this.performance.communicationsCoordinated += 1;
    const report = this.manager.coordinateCustomerCommunications(input, this.config);
    this.finalizeOperation(report, "coordinate_communication");
    return report;
  }

  generateReturnInsights(input: GenerateReturnInsightsInput = {}): ReturnsIntelligenceRunReport {
    const report = this.manager.generateReturnInsights(input, this.config);
    this.performance.insightsGenerated += report.insights.length;
    this.finalizeOperation(report, "generate_insights");
    return report;
  }

  detectReturnFailures(input: DetectReturnFailuresInput = {}): ReturnsIntelligenceRunReport {
    const report = this.manager.detectReturnFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  reportReturnStatus(): ReturnsIntelligenceRunReport {
    const report = this.manager.reportReturnStatus(this.config);
    this.finalizeOperation(report, "report_status");
    return report;
  }

  reportReturnHealth(): ReturnsIntelligenceRunReport {
    const report = this.manager.reportReturnHealth(this.config);
    this.finalizeOperation(report, "report_health");
    return report;
  }

  private finalizeOperation(report: ReturnsIntelligenceRunReport, action: string): void {
    this.latestReport = report;
    this.performance.totalOperations += 1;
    const duration = report.durationMs;

    if (report.validation.decision === "fail") {
      this.performance.failedOperations += 1;
      this.recoveryManager.recordFailure(
        `${action} failed: ${report.validation.errors.join("; ")}`,
        this.config,
      );
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
    appendRieLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
