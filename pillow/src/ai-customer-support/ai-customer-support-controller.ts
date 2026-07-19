/** R4-08 — AI Customer Support Controller. */

import { appendAcsLog } from "./acs-logging.js";
import { AiCustomerSupportManager } from "./ai-customer-support-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AiCustomerSupportConfiguration } from "./configuration.js";
import type {
  AiSupportPerformanceStats,
  AiSupportRunReport,
  ConnectAiCustomerSupportInput,
  DetectSupportFailuresInput,
  EngineStatus,
  EscalateEnquiryInput,
  GenerateAiResponseInput,
  GenerateSupportSummaryInput,
  HandleMultiChannelSupportInput,
  ReceiveCustomerEnquiryInput,
  RetrieveCustomerContextInput,
  UnderstandCustomerIntentInput,
} from "./types.js";

export class AiCustomerSupportController {
  private config: AiCustomerSupportConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AiSupportRunReport | null = null;
  private readonly manager: AiCustomerSupportManager;
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AiSupportPerformanceStats = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    enquiriesReceived: 0,
    intentsUnderstood: 0,
    contextsRetrieved: 0,
    responsesGenerated: 0,
    escalationsPerformed: 0,
    multiChannelHandled: 0,
    summariesGenerated: 0,
    failuresDetected: 0,
    retryAttempts: 0,
    averageOperationDurationMs: 0,
    peakOperationDurationMs: 0,
    averageResponseLatencyMs: 0,
  };

  constructor(manager: AiCustomerSupportManager, config: AiCustomerSupportConfiguration) {
    this.manager = manager;
    this.config = config;
  }

  initialize(): void {
    this.status = "active";
    appendAcsLog({
      event: "engine_initialization",
      level: "info",
      details: "AI Customer Support ready (R4-08)",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): AiCustomerSupportConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AiCustomerSupportConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AiSupportRunReport | null {
    return this.latestReport;
  }

  getManager(): AiCustomerSupportManager {
    return this.manager;
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getPerformance(): AiSupportPerformanceStats {
    return { ...this.performance };
  }

  connectAiCustomerSupport(input: ConnectAiCustomerSupportInput = {}): AiSupportRunReport {
    if (!this.config.enabled) throw new Error("AI Customer Support is disabled");
    this.status = "connecting";
    const report = this.manager.connectAiCustomerSupport(input, this.config);
    this.finalizeOperation(report, "connect");
    return report;
  }

  receiveCustomerEnquiry(input: ReceiveCustomerEnquiryInput): AiSupportRunReport {
    this.performance.enquiriesReceived += 1;
    const report = this.manager.receiveCustomerEnquiry(input, this.config);
    this.finalizeOperation(report, "receive_enquiry");
    return report;
  }

  understandCustomerIntent(input: UnderstandCustomerIntentInput): AiSupportRunReport {
    this.performance.intentsUnderstood += 1;
    const report = this.manager.understandCustomerIntent(input, this.config);
    this.finalizeOperation(report, "understand_intent");
    return report;
  }

  retrieveCustomerContext(input: RetrieveCustomerContextInput): AiSupportRunReport {
    this.performance.contextsRetrieved += 1;
    const report = this.manager.retrieveCustomerContext(input, this.config);
    this.finalizeOperation(report, "retrieve_context");
    return report;
  }

  generateAiResponse(input: GenerateAiResponseInput): AiSupportRunReport {
    this.performance.responsesGenerated += 1;
    const report = this.manager.generateAiResponse(input, this.config);
    this.finalizeOperation(report, "generate_response");
    return report;
  }

  escalateEnquiry(input: EscalateEnquiryInput): AiSupportRunReport {
    this.performance.escalationsPerformed += 1;
    const report = this.manager.escalateEnquiry(input, this.config);
    this.finalizeOperation(report, "escalate_enquiry");
    return report;
  }

  handleMultiChannelSupport(input: HandleMultiChannelSupportInput): AiSupportRunReport {
    this.performance.multiChannelHandled += 1;
    const report = this.manager.handleMultiChannelSupport(input, this.config);
    this.finalizeOperation(report, "multi_channel_support");
    return report;
  }

  generateSupportSummary(input: GenerateSupportSummaryInput): AiSupportRunReport {
    this.performance.summariesGenerated += 1;
    const report = this.manager.generateSupportSummary(input, this.config);
    this.finalizeOperation(report, "generate_summary");
    return report;
  }

  detectSupportFailures(input: DetectSupportFailuresInput = {}): AiSupportRunReport {
    const report = this.manager.detectSupportFailures(input, this.config);
    this.performance.failuresDetected += report.failures.length;
    this.finalizeOperation(report, "detect_failures");
    return report;
  }

  private finalizeOperation(report: AiSupportRunReport, action: string): void {
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
    if (action === "generate_response") {
      this.performance.averageResponseLatencyMs = Math.round(
        (this.performance.averageResponseLatencyMs * (this.performance.responsesGenerated - 1) +
          duration) /
          Math.max(1, this.performance.responsesGenerated),
      );
    }

    this.healthMonitor.recordOperation(report.validation.decision);
    appendAcsLog({
      event: "framework_operation_end",
      level: report.validation.decision === "fail" ? "warn" : "info",
      details: `${action} ${report.validation.decision} · ${duration}ms`,
    });
  }
}
