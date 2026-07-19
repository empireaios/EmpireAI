/** R4-10 — Customer Sentiment Controller. */

import { appendCseLog } from "./cse-logging.js";
import { CustomerSentimentManager } from "./customer-sentiment-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { CustomerSentimentEngineConfiguration } from "./configuration.js";
import type {
  AnalyzeCustomerConversationInput,
  AnalyzeCustomerMessageInput,
  CalculateSentimentScoreInput,
  ConnectCustomerSentimentEngineInput,
  DetectCustomerFrustrationInput,
  DetectCustomerSatisfactionInput,
  DetectEscalationRiskInput,
  DetectPositiveExperienceInput,
  DetectSentimentFailuresInput,
  EngineStatus,
  GenerateSentimentAlertsInput,
  SentimentPerformanceStats,
  SentimentRunReport,
  TrackSentimentTrendsInput,
} from "./types.js";

export class CustomerSentimentController {
  private config: CustomerSentimentEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SentimentRunReport | null = null;
  private readonly manager: CustomerSentimentManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: SentimentPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    messagesAnalyzed: 0,
    conversationsAnalyzed: 0,
    satisfactionDetected: 0,
    frustrationDetected: 0,
    escalationRiskDetected: 0,
    positiveExperiencesDetected: 0,
    trendsTracked: 0,
    scoresCalculated: 0,
    alertsGenerated: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
  };

  constructor(manager: CustomerSentimentManager, config: CustomerSentimentEngineConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendCseLog({
      event: "engine_initialization",
      level: "info",
      details: "Customer Sentiment Engine ready (R4-10)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): CustomerSentimentEngineConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: CustomerSentimentEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): SentimentRunReport | null {
    return this.latestReport;
  }

  getManager(): CustomerSentimentManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): SentimentPerformanceStats {
    return { ...this.performance };
  }

  connectCustomerSentimentEngine(
    input: ConnectCustomerSentimentEngineInput = {},
  ): SentimentRunReport {
    if (!this.config.enabled) throw new Error("Customer Sentiment Engine is disabled");
    this.status = "connecting";
    const report = this.manager.connectCustomerSentimentEngine(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  analyzeCustomerMessage(input: AnalyzeCustomerMessageInput): SentimentRunReport {
    this.performance.messagesAnalyzed += 1;
    const report = this.manager.analyzeCustomerMessage(input, this.config);
    this.finalizeOperation(report, "analyze_message");
    return report;
  }

  analyzeCustomerConversation(input: AnalyzeCustomerConversationInput): SentimentRunReport {
    this.performance.conversationsAnalyzed += 1;
    const report = this.manager.analyzeCustomerConversation(input, this.config);
    this.finalizeOperation(report, "analyze_conversation");
    return report;
  }

  detectCustomerSatisfaction(input: DetectCustomerSatisfactionInput = {}): SentimentRunReport {
    const report = this.manager.detectCustomerSatisfaction(input, this.config);
    this.performance.satisfactionDetected += report.sentimentRecords.length;
    this.finalizeOperation(report, "detect_satisfaction");
    return report;
  }

  detectCustomerFrustration(input: DetectCustomerFrustrationInput = {}): SentimentRunReport {
    const report = this.manager.detectCustomerFrustration(input, this.config);
    this.performance.frustrationDetected += report.sentimentRecords.length;
    this.finalizeOperation(report, "detect_frustration");
    return report;
  }

  detectEscalationRisk(input: DetectEscalationRiskInput = {}): SentimentRunReport {
    const report = this.manager.detectEscalationRisk(input, this.config);
    this.performance.escalationRiskDetected += report.sentimentRecords.length;
    this.finalizeOperation(report, "detect_escalation_risk");
    return report;
  }

  detectPositiveExperience(input: DetectPositiveExperienceInput = {}): SentimentRunReport {
    const report = this.manager.detectPositiveExperience(input, this.config);
    this.performance.positiveExperiencesDetected += report.sentimentRecords.length;
    this.finalizeOperation(report, "detect_positive_experience");
    return report;
  }

  trackSentimentTrends(input: TrackSentimentTrendsInput): SentimentRunReport {
    const report = this.manager.trackSentimentTrends(input, this.config);
    this.performance.trendsTracked += report.trends.length;
    this.finalizeOperation(report, "track_trends");
    return report;
  }

  calculateSentimentScore(input: CalculateSentimentScoreInput): SentimentRunReport {
    this.performance.scoresCalculated += 1;
    const report = this.manager.calculateSentimentScore(input, this.config);
    this.finalizeOperation(report, "calculate_score");
    return report;
  }

  generateSentimentAlerts(input: GenerateSentimentAlertsInput = {}): SentimentRunReport {
    const report = this.manager.generateSentimentAlerts(input, this.config);
    this.performance.alertsGenerated += report.alerts.length;
    this.finalizeOperation(report, "generate_alerts");
    return report;
  }

  detectSentimentFailures(input: DetectSentimentFailuresInput = {}): SentimentRunReport {
    const report = this.manager.detectSentimentFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: SentimentRunReport, action: string): void {
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
    appendCseLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
