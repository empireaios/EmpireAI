/** R4-04 — Email Communication Manager. */

import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendEceLog } from "./ece-logging.js";
import { EmailRegistry } from "./email-registry.js";
import { EmailMetadataGenerator } from "./email-metadata-generator.js";
import { EmailDeliveryEngine } from "./email-delivery-engine.js";
import { EmailTemplateManager } from "./email-template-manager.js";
import { EmailQueueManager } from "./email-queue-manager.js";
import { EmailTrackingEngine } from "./email-tracking-engine.js";
import { EmailAnalyticsEngine } from "./email-analytics-engine.js";
import { EmailValidationEngine } from "./email-validation-engine.js";
import { EmailValidator } from "./email-validator.js";
import { EmailRetryManager } from "./email-retry-manager.js";
import type { EmailCommunicationEngineConfiguration } from "./configuration.js";
import type {
  ConnectEmailCommunicationEngineInput,
  CreateEmailTemplateInput,
  DetectEmailFailuresInput,
  EmailCategory,
  EmailEngineRecord,
  EmailFailure,
  EmailRecord,
  EmailRunReport,
  ProcessEmailQueueInput,
  SendEmailInput,
  TrackEmailClickInput,
  TrackEmailOpenInput,
} from "./types.js";

export class EmailCommunicationManager {
  private engineRecord: EmailEngineRecord | null = null;
  private readonly registry = new EmailRegistry();
  private readonly metadataGenerator = new EmailMetadataGenerator();
  private readonly deliveryEngine = new EmailDeliveryEngine();
  private readonly templateManager = new EmailTemplateManager();
  private readonly queueManager = new EmailQueueManager();
  private readonly trackingEngine = new EmailTrackingEngine();
  private readonly analyticsEngine = new EmailAnalyticsEngine();
  private readonly validationEngine = new EmailValidationEngine();
  private readonly validator = new EmailValidator();
  private readonly retryManager = new EmailRetryManager();
  private readonly failures: EmailFailure[] = [];

  constructor(
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
  ) {}

  getEngineRecord(): EmailEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): EmailRegistry {
    return this.registry;
  }

  getEmailRecords(): EmailRecord[] {
    return this.registry.listEmails();
  }

  getTemplates() {
    return this.registry.listTemplates();
  }

  getFailures(): EmailFailure[] {
    return [...this.failures];
  }

  getAnalyticsEngine(): EmailAnalyticsEngine {
    return this.analyticsEngine;
  }

  getRetryManager(): EmailRetryManager {
    return this.retryManager;
  }

  private isEngineConnected(
    engine: { getEngineRecord?: () => { currentOperationalState?: string } | null } | null,
  ): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  private resolveCustomer(customerId: string): { valid: boolean; error: string | null } {
    if (!this.crmFoundation) {
      return { valid: false, error: "CRM Foundation unavailable" };
    }
    const crm = this.crmFoundation.getCrmRecords().find((r) => r.customerId === customerId);
    if (!crm) {
      return { valid: false, error: `CRM record for customer ${customerId} not found` };
    }
    return { valid: true, error: null };
  }

  private recordToTimeline(customerId: string, description: string, reference: string): void {
    try {
      this.timelineEngine?.recordCommunication({
        customerId,
        eventReference: reference,
        eventDescription: description,
        eventSource: "communication",
      });
    } catch {
      // Timeline recording is best-effort
    }
  }

  connectEmailCommunicationEngine(
    _input: ConnectEmailCommunicationEngineInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const crmConnected = this.isEngineConnected(this.crmFoundation);
    const timelineConnected = this.isEngineConnected(this.timelineEngine);

    const record = this.metadataGenerator.buildEngineRecord({
      operationalState:
        configValidation.decision === "fail"
          ? "failed"
          : crmConnected && timelineConnected
            ? "active"
            : "connected",
      validationStatus: configValidation.decision === "pass" ? "passed" : "partial",
      crmFoundationConnected: crmConnected,
      timelineEngineConnected: timelineConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (configValidation.decision !== "pass") {
      validation.warnings.push(...configValidation.warnings);
      if (configValidation.errors.length > 0) {
        validation.errors.push(...configValidation.errors);
        validation.decision = "fail";
      } else {
        validation.decision = "partial";
      }
    }

    appendEceLog({
      event: "engine_initialization",
      level: "info",
      details: `Email Communication Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      emailRecords: [],
      templates: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  sendTransactionalEmail(
    input: SendEmailInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.sendEmail("send_transactional", "transactional", input, config);
  }

  sendMarketingEmail(
    input: SendEmailInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.sendEmail("send_marketing", "marketing", input, config);
  }

  sendNotificationEmail(
    input: SendEmailInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.sendEmail("send_notification", "notification", input, config);
  }

  sendSupportEmail(
    input: SendEmailInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.sendEmail("send_support", "support", input, config);
  }

  createEmailTemplate(
    input: CreateEmailTemplateInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction("create_template", config, () => {
      const template = this.templateManager.createTemplate(input);
      const validation = this.validationEngine.validateTemplate(template);
      if (validation.decision === "fail") {
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }
      this.registry.storeTemplate(template);
      appendEceLog({
        event: "email_creation",
        level: "info",
        details: `Template ${template.templateId} created (${input.emailCategory})`,
      });
      return { emailRecords: [], templates: [template], failures: [], validation, error: null };
    });
  }

  processEmailQueue(
    input: ProcessEmailQueueInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction("process_queue", config, () => {
      const batch = this.queueManager.dequeueBatch(this.registry, config, input.limit);
      const delivered: EmailRecord[] = [];
      const failures: EmailFailure[] = [];

      for (const record of batch) {
        const updated = this.queueManager.markDelivered(record);
        this.registry.storeEmail(updated);
        delivered.push(updated);
        this.recordToTimeline(
          updated.customerId,
          `Email delivered (${updated.emailCategory})`,
          updated.emailRecordId,
        );
        appendEceLog({
          event: "email_delivery",
          level: "info",
          details: `Email ${updated.emailRecordId} delivered`,
        });
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return { emailRecords: delivered, templates: [], failures, validation, error: null };
    });
  }

  trackEmailOpen(
    input: TrackEmailOpenInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction("track_open", config, () => {
      const existing = this.registry.getEmail(input.emailRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Email record not found");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Email record not found",
        };
      }
      const updated = this.trackingEngine.trackOpen(existing);
      this.registry.storeEmail(updated);
      appendEceLog({
        event: "email_tracking",
        level: "info",
        details: `Open tracked for ${input.emailRecordId}`,
      });
      const validation = this.validationEngine.validateEmailRecord(updated, config);
      return { emailRecords: [updated], templates: [], failures: [], validation, error: null };
    });
  }

  trackEmailClick(
    input: TrackEmailClickInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction("track_click", config, () => {
      const existing = this.registry.getEmail(input.emailRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Email record not found");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Email record not found",
        };
      }
      const updated = this.trackingEngine.trackClick(existing);
      this.registry.storeEmail(updated);
      appendEceLog({
        event: "email_tracking",
        level: "info",
        details: `Click tracked for ${input.emailRecordId}`,
      });
      const validation = this.validationEngine.validateEmailRecord(updated, config);
      return { emailRecords: [updated], templates: [], failures: [], validation, error: null };
    });
  }

  detectEmailFailures(
    input: DetectEmailFailuresInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.emailRecordId
        ? [this.registry.getEmail(input.emailRecordId)].filter(Boolean) as EmailRecord[]
        : this.registry.listEmails();
      const detected: EmailFailure[] = [];

      for (const record of records) {
        if (record.deliveryStatus === "failed" || record.deliveryStatus === "bounced") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.emailRecordId,
              `Email ${record.emailRecordId} ${record.deliveryStatus}`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (!this.failures.some((x) => x.emailRecordId === f.emailRecordId && x.reason === f.reason)) {
          this.failures.push(f);
        }
      }

      appendEceLog({
        event: "delivery_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} email failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        emailRecords: records,
        templates: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "Email failures detected" : null,
      };
    });
  }

  private sendEmail(
    action: EmailRunReport["action"],
    category: EmailCategory,
    input: SendEmailInput,
    config: EmailCommunicationEngineConfiguration,
  ): EmailRunReport {
    return this.runAction(action, config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: customer.error,
        };
      }

      const addressCheck = this.deliveryEngine.validateAddress(input.recipientAddress);
      if (!addressCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(addressCheck.error ?? "Invalid address");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: addressCheck.error,
        };
      }

      const deliveryCheck = this.deliveryEngine.canDeliver(category, config);
      if (!deliveryCheck.allowed) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(deliveryCheck.error ?? "Delivery not allowed");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: deliveryCheck.error,
        };
      }

      const requireTemplate = config.templateRules.find((r) => r.ruleId === "require_template");
      if (requireTemplate?.enabled && requireTemplate.requireTemplate && !input.templateId) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Email template is required");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Email template is required",
        };
      }

      const { reference } = this.templateManager.resolveTemplateRef(
        this.registry,
        input.templateId,
        category,
      );

      const sendKey = `${input.customerId}:${category}:${reference}:${input.recipientAddress}`;
      if (config.duplicateDetectionEnabled && this.registry.hasSendKey(sendKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate email request detected");
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Duplicate email request detected",
        };
      }

      const record = this.metadataGenerator.buildEmailRecord({
        customerId: input.customerId,
        emailTemplateReference: reference,
        emailCategory: category,
        recipientAddress: input.recipientAddress.trim(),
        deliveryStatus: "queued",
      });

      const validation = this.validationEngine.validateEmailRecord(record, config);
      if (validation.decision === "fail") {
        return {
          emailRecords: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.queueManager.enqueue(this.registry, record);
      this.registry.storeEmail(record, sendKey);

      appendEceLog({
        event: "email_creation",
        level: "info",
        details: `Email ${record.emailRecordId} queued (${category}) for ${input.customerId}`,
      });

      this.recordToTimeline(
        input.customerId,
        `Email queued (${category}): ${reference}`,
        record.emailRecordId,
      );

      return { emailRecords: [record], templates: [], failures: [], validation, error: null };
    });
  }

  private runAction(
    action: EmailRunReport["action"],
    config: EmailCommunicationEngineConfiguration,
    fn: () => {
      emailRecords: EmailRecord[];
      templates: EmailRunReport["templates"];
      failures: EmailFailure[];
      validation: EmailRunReport["validation"];
      error: string | null;
    },
  ): EmailRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Email communication engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      emailRecords: result.emailRecords,
      templates: result.templates,
      failures: result.failures,
      validation: result.validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
    this.failures.length = 0;
  }
}
