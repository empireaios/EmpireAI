import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import {
  buildSmsCommunicationEngineConfiguration,
  type SmsCommunicationEngineConfiguration,
} from "./configuration.js";
import { appendSceLog, getSceLogs, resetSceLogsForTesting } from "./sce-logging.js";
import { SMS_COMMUNICATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectSmsCommunicationEngineInput,
  CreateSmsTemplateInput,
  DetectSmsFailuresInput,
  ProcessSmsQueueInput,
  RetrySmsInput,
  SendSmsInput,
  SmsCockpitSnapshot,
  SmsCommunicationEngineState,
  SmsRunReport,
  TrackDeliveryConfirmationInput,
} from "./types.js";
import { SmsCommunicationController } from "./sms-communication-controller.js";
import { SmsCommunicationManager } from "./sms-communication-manager.js";

export interface SmsCommunicationEngineOptions {
  configuration?: Partial<SmsCommunicationEngineConfiguration>;
}

/**
 * SMS Communication Engine (PILLOW-SCE-001 / R4-05).
 * Centralized SMS communication consuming R4-02 and R4-03.
 */
export class SmsCommunicationEngine {
  private initializedAt: string | null = null;
  private readonly controller: SmsCommunicationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    options: SmsCommunicationEngineOptions = {},
  ) {
    const config = buildSmsCommunicationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SmsCommunicationManager(crmFoundation, timelineEngine);
    this.controller = new SmsCommunicationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SmsCommunicationEngineState> {
    const doc = await this.reader.readText(SMS_COMMUNICATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("SMS Communication Engine")) {
      throw new Error(
        `${SMS_COMMUNICATION_ENGINE_SYSTEM_PATH} missing — SMS Communication Engine requires R4-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSceLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-05 SMS Communication Engine initialized",
    });
    return this.getState();
  }

  getState(): SmsCommunicationEngineState {
    if (!this.initializedAt) {
      throw new Error("SMS Communication Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const smsRecords = this.controller.getManager().getSmsRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(smsRecords);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSmsRecords: summary.total,
      queuedSms: summary.queued,
      deliveredSms: summary.delivered,
      failedSms: summary.failed,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SCE-001",
      missionId: "R4-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSmsCommunicationEngine(
    input: ConnectSmsCommunicationEngineInput = {},
  ): SmsRunReport {
    return this.controller.connectSmsCommunicationEngine(input);
  }

  sendTransactionalSms(input: SendSmsInput): SmsRunReport {
    return this.controller.sendTransactionalSms(input);
  }

  sendNotificationSms(input: SendSmsInput): SmsRunReport {
    return this.controller.sendNotificationSms(input);
  }

  sendVerificationSms(input: SendSmsInput): SmsRunReport {
    return this.controller.sendVerificationSms(input);
  }

  createSmsTemplate(input: CreateSmsTemplateInput): SmsRunReport {
    return this.controller.createSmsTemplate(input);
  }

  processSmsQueue(input: ProcessSmsQueueInput = {}): SmsRunReport {
    return this.controller.processSmsQueue(input);
  }

  trackDeliveryConfirmation(input: TrackDeliveryConfirmationInput): SmsRunReport {
    return this.controller.trackDeliveryConfirmation(input);
  }

  retrySms(input: RetrySmsInput): SmsRunReport {
    return this.controller.retrySms(input);
  }

  detectSmsFailures(input: DetectSmsFailuresInput = {}): SmsRunReport {
    return this.controller.detectSmsFailures(input);
  }

  getLatestReport(): SmsRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSmsRecords() {
    return this.controller.getManager().getSmsRecords();
  }

  getTemplates() {
    return this.controller.getManager().getTemplates();
  }

  getMachineReadableRecord(smsRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getSms(smsRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<SmsCommunicationEngineConfiguration>,
  ): SmsCommunicationEngineState {
    const next = buildSmsCommunicationEngineConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `SMS status: ${state.status}`,
        `SMS: ${state.health.totalSmsRecords} total · ${state.health.deliveredSms} delivered`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No SMS operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SmsCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSmsRecords: state.health.totalSmsRecords,
      queuedSms: state.health.queuedSms,
      deliveredSms: state.health.deliveredSms,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getSceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSmsCommunicationEngine(
  bootstrap: EmpireBootstrapContext,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  options?: SmsCommunicationEngineOptions,
): SmsCommunicationEngine {
  return new SmsCommunicationEngine(bootstrap, crmFoundation, timelineEngine, options);
}

export function resetSmsCommunicationEngineForTesting(): void {
  resetSceLogsForTesting();
  new SmsCommunicationManager(null, null).resetForTesting();
}
