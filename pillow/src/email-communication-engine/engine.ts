import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import {
  buildEmailCommunicationEngineConfiguration,
  type EmailCommunicationEngineConfiguration,
} from "./configuration.js";
import { appendEceLog, getEceLogs, resetEceLogsForTesting } from "./ece-logging.js";
import { EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectEmailCommunicationEngineInput,
  CreateEmailTemplateInput,
  DetectEmailFailuresInput,
  EmailCockpitSnapshot,
  EmailCommunicationEngineState,
  EmailRunReport,
  ProcessEmailQueueInput,
  SendEmailInput,
  TrackEmailClickInput,
  TrackEmailOpenInput,
} from "./types.js";
import { EmailCommunicationController } from "./email-communication-controller.js";
import { EmailCommunicationManager } from "./email-communication-manager.js";

export interface EmailCommunicationEngineOptions {
  configuration?: Partial<EmailCommunicationEngineConfiguration>;
}

/**
 * Email Communication Engine (PILLOW-ECE-001 / R4-04).
 * Centralized email communication consuming R4-02 and R4-03.
 */
export class EmailCommunicationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EmailCommunicationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    crmFoundation: CrmFoundationEngine,
    timelineEngine: CustomerTimelineEngine,
    options: EmailCommunicationEngineOptions = {},
  ) {
    const config = buildEmailCommunicationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new EmailCommunicationManager(crmFoundation, timelineEngine);
    this.controller = new EmailCommunicationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EmailCommunicationEngineState> {
    const doc = await this.reader.readText(EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Email Communication Engine")) {
      throw new Error(
        `${EMAIL_COMMUNICATION_ENGINE_SYSTEM_PATH} missing — Email Communication Engine requires R4-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEceLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-04 Email Communication Engine initialized",
    });
    return this.getState();
  }

  getState(): EmailCommunicationEngineState {
    if (!this.initializedAt) {
      throw new Error("Email Communication Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const emails = this.controller.getManager().getEmailRecords();
    const summary = this.controller.getManager().getAnalyticsEngine().summarize(emails);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalEmailRecords: summary.total,
      queuedEmails: summary.queued,
      deliveredEmails: summary.delivered,
      failedEmails: summary.failed,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ECE-001",
      missionId: "R4-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectEmailCommunicationEngine(
    input: ConnectEmailCommunicationEngineInput = {},
  ): EmailRunReport {
    return this.controller.connectEmailCommunicationEngine(input);
  }

  sendTransactionalEmail(input: SendEmailInput): EmailRunReport {
    return this.controller.sendTransactionalEmail(input);
  }

  sendMarketingEmail(input: SendEmailInput): EmailRunReport {
    return this.controller.sendMarketingEmail(input);
  }

  sendNotificationEmail(input: SendEmailInput): EmailRunReport {
    return this.controller.sendNotificationEmail(input);
  }

  sendSupportEmail(input: SendEmailInput): EmailRunReport {
    return this.controller.sendSupportEmail(input);
  }

  createEmailTemplate(input: CreateEmailTemplateInput): EmailRunReport {
    return this.controller.createEmailTemplate(input);
  }

  processEmailQueue(input: ProcessEmailQueueInput = {}): EmailRunReport {
    return this.controller.processEmailQueue(input);
  }

  trackEmailOpen(input: TrackEmailOpenInput): EmailRunReport {
    return this.controller.trackEmailOpen(input);
  }

  trackEmailClick(input: TrackEmailClickInput): EmailRunReport {
    return this.controller.trackEmailClick(input);
  }

  detectEmailFailures(input: DetectEmailFailuresInput = {}): EmailRunReport {
    return this.controller.detectEmailFailures(input);
  }

  getLatestReport(): EmailRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getEmailRecords() {
    return this.controller.getManager().getEmailRecords();
  }

  getTemplates() {
    return this.controller.getManager().getTemplates();
  }

  getMachineReadableRecord(emailRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getEmail(emailRecordId);
    if (!record) return null;
    return this.controller.getManager().getAnalyticsEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<EmailCommunicationEngineConfiguration>,
  ): EmailCommunicationEngineState {
    const next = buildEmailCommunicationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Email status: ${state.status}`,
        `Emails: ${state.health.totalEmailRecords} total · ${state.health.deliveredEmails} delivered`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No email operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EmailCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalEmailRecords: state.health.totalEmailRecords,
      queuedEmails: state.health.queuedEmails,
      deliveredEmails: state.health.deliveredEmails,
      crmFoundationConnected: record?.crmFoundationConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      recentLogs: getEceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createEmailCommunicationEngine(
  bootstrap: EmpireBootstrapContext,
  crmFoundation: CrmFoundationEngine,
  timelineEngine: CustomerTimelineEngine,
  options?: EmailCommunicationEngineOptions,
): EmailCommunicationEngine {
  return new EmailCommunicationEngine(bootstrap, crmFoundation, timelineEngine, options);
}

export function resetEmailCommunicationEngineForTesting(): void {
  resetEceLogsForTesting();
  new EmailCommunicationManager(null, null).resetForTesting();
}
