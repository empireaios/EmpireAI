/** R4-05 — SMS Communication Manager. */

import type { CrmFoundationEngine } from "../crm-foundation/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import { appendSceLog } from "./sce-logging.js";
import { SmsRegistry } from "./sms-registry.js";
import { SmsMetadataGenerator } from "./sms-metadata-generator.js";
import { SmsDeliveryEngine } from "./sms-delivery-engine.js";
import { SmsTemplateManager } from "./sms-template-manager.js";
import { SmsQueueManager } from "./sms-queue-manager.js";
import { SmsTrackingEngine } from "./sms-tracking-engine.js";
import { SmsAnalyticsEngine } from "./sms-analytics-engine.js";
import { SmsValidationEngine } from "./sms-validation-engine.js";
import { SmsValidator } from "./sms-validator.js";
import { SmsRetryManager } from "./sms-retry-manager.js";
import type { SmsCommunicationEngineConfiguration } from "./configuration.js";
import type {
  ConnectSmsCommunicationEngineInput,
  CreateSmsTemplateInput,
  DetectSmsFailuresInput,
  ProcessSmsQueueInput,
  RetrySmsInput,
  SendSmsInput,
  SmsCategory,
  SmsEngineRecord,
  SmsFailure,
  SmsRecord,
  SmsRunReport,
  TrackDeliveryConfirmationInput,
} from "./types.js";

export class SmsCommunicationManager {
  private engineRecord: SmsEngineRecord | null = null;
  private readonly registry = new SmsRegistry();
  private readonly metadataGenerator = new SmsMetadataGenerator();
  private readonly deliveryEngine = new SmsDeliveryEngine();
  private readonly templateManager = new SmsTemplateManager();
  private readonly queueManager = new SmsQueueManager();
  private readonly trackingEngine = new SmsTrackingEngine();
  private readonly analyticsEngine = new SmsAnalyticsEngine();
  private readonly validationEngine = new SmsValidationEngine();
  private readonly validator = new SmsValidator();
  private readonly retryManager = new SmsRetryManager();
  private readonly failures: SmsFailure[] = [];

  constructor(
    private readonly crmFoundation: CrmFoundationEngine | null,
    private readonly timelineEngine: CustomerTimelineEngine | null,
  ) {}

  getEngineRecord(): SmsEngineRecord | null {
    return this.engineRecord;
  }

  getRegistry(): SmsRegistry {
    return this.registry;
  }

  getSmsRecords(): SmsRecord[] {
    return this.registry.listSms();
  }

  getTemplates() {
    return this.registry.listTemplates();
  }

  getAnalyticsEngine(): SmsAnalyticsEngine {
    return this.analyticsEngine;
  }

  getRetryManager(): SmsRetryManager {
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
      // best-effort
    }
  }

  connectSmsCommunicationEngine(
    _input: ConnectSmsCommunicationEngineInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
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

    appendSceLog({
      event: "engine_initialization",
      level: "info",
      details: `SMS Communication Engine connected: ${validation.decision}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      smsRecords: [],
      templates: [],
      failures: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  sendTransactionalSms(
    input: SendSmsInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.sendSms("send_transactional", "transactional", input, config);
  }

  sendNotificationSms(
    input: SendSmsInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.sendSms("send_notification", "notification", input, config);
  }

  sendVerificationSms(
    input: SendSmsInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.sendSms("send_verification", "verification", input, config);
  }

  createSmsTemplate(
    input: CreateSmsTemplateInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.runAction("create_template", config, () => {
      const template = this.templateManager.createTemplate(input);
      const validation = this.validationEngine.validateTemplate(template);
      if (validation.decision === "fail") {
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }
      this.registry.storeTemplate(template);
      appendSceLog({
        event: "sms_creation",
        level: "info",
        details: `Template ${template.templateId} created (${input.smsCategory})`,
      });
      return { smsRecords: [], templates: [template], failures: [], validation, error: null };
    });
  }

  processSmsQueue(
    input: ProcessSmsQueueInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.runAction("process_queue", config, () => {
      const batch = this.queueManager.dequeueBatch(this.registry, config, input.limit);
      const delivered: SmsRecord[] = [];

      for (const record of batch) {
        const updated = this.queueManager.markDelivered(record);
        this.registry.storeSms(updated);
        delivered.push(updated);
        this.recordToTimeline(
          updated.customerId,
          `SMS delivered (${updated.smsCategory})`,
          updated.smsRecordId,
        );
        appendSceLog({
          event: "sms_delivery",
          level: "info",
          details: `SMS ${updated.smsRecordId} delivered`,
        });
      }

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return { smsRecords: delivered, templates: [], failures: [], validation, error: null };
    });
  }

  trackDeliveryConfirmation(
    input: TrackDeliveryConfirmationInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.runAction("track_confirmation", config, () => {
      const existing = this.registry.getSms(input.smsRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("SMS record not found");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "SMS record not found",
        };
      }
      const updated = this.trackingEngine.trackConfirmation(existing);
      this.registry.storeSms(updated);
      appendSceLog({
        event: "sms_tracking",
        level: "info",
        details: `Delivery confirmed for ${input.smsRecordId}`,
      });
      const validation = this.validationEngine.validateSmsRecord(updated, config);
      return { smsRecords: [updated], templates: [], failures: [], validation, error: null };
    });
  }

  retrySms(input: RetrySmsInput, config: SmsCommunicationEngineConfiguration): SmsRunReport {
    return this.runAction("retry_sms", config, () => {
      const existing = this.registry.getSms(input.smsRecordId);
      if (!existing) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("SMS record not found");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "SMS record not found",
        };
      }

      const deliveryCheck = this.deliveryEngine.canDeliver(existing.smsCategory, config);
      if (!this.retryManager.canRetry(existing.retryCount, deliveryCheck.maxRetries)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Maximum retry count exceeded");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Maximum retry count exceeded",
        };
      }

      this.retryManager.recordRetry(`SMS ${input.smsRecordId}`);
      const requeued = this.queueManager.requeueForRetry(existing);
      this.registry.storeSms(requeued);

      appendSceLog({
        event: "recovery_attempt",
        level: "info",
        details: `SMS ${input.smsRecordId} requeued (retry ${requeued.retryCount})`,
      });

      const validation = this.validationEngine.validateSmsRecord(requeued, config);
      return { smsRecords: [requeued], templates: [], failures: [], validation, error: null };
    });
  }

  detectSmsFailures(
    input: DetectSmsFailuresInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.runAction("detect_failures", config, () => {
      const records = input.smsRecordId
        ? [this.registry.getSms(input.smsRecordId)].filter(Boolean) as SmsRecord[]
        : this.registry.listSms();
      const detected: SmsFailure[] = [];

      for (const record of records) {
        if (record.deliveryStatus === "failed" || record.deliveryStatus === "bounced") {
          detected.push(
            this.metadataGenerator.buildFailure(
              record.smsRecordId,
              `SMS ${record.smsRecordId} ${record.deliveryStatus}`,
              "high",
            ),
          );
        }
      }

      for (const f of detected) {
        if (!this.failures.some((x) => x.smsRecordId === f.smsRecordId && x.reason === f.reason)) {
          this.failures.push(f);
        }
      }

      appendSceLog({
        event: "delivery_failure",
        level: detected.length > 0 ? "warn" : "info",
        details: `Detected ${detected.length} SMS failure(s)`,
      });

      const validation = this.validator.validateEngineRecord(this.engineRecord!);
      return {
        smsRecords: records,
        templates: [],
        failures: detected,
        validation,
        error: detected.length > 0 ? "SMS failures detected" : null,
      };
    });
  }

  private sendSms(
    action: SmsRunReport["action"],
    category: SmsCategory,
    input: SendSmsInput,
    config: SmsCommunicationEngineConfiguration,
  ): SmsRunReport {
    return this.runAction(action, config, () => {
      const customer = this.resolveCustomer(input.customerId);
      if (!customer.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(customer.error ?? "Invalid customer");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: customer.error,
        };
      }

      const phoneCheck = this.deliveryEngine.validatePhoneNumber(input.recipientPhoneNumber);
      if (!phoneCheck.valid) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(phoneCheck.error ?? "Invalid phone");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: phoneCheck.error,
        };
      }

      const deliveryCheck = this.deliveryEngine.canDeliver(category, config);
      if (!deliveryCheck.allowed) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push(deliveryCheck.error ?? "Delivery not allowed");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: deliveryCheck.error,
        };
      }

      const { reference } = this.templateManager.resolveTemplateRef(
        this.registry,
        input.templateId,
        category,
      );

      const normalizedPhone = input.recipientPhoneNumber.replace(/[\s\-()]/g, "");
      const sendKey = `${input.customerId}:${category}:${reference}:${normalizedPhone}`;
      if (config.duplicateDetectionEnabled && this.registry.hasSendKey(sendKey)) {
        const validation = this.validator.validateEngineRecord(this.engineRecord!);
        validation.decision = "fail";
        validation.errors.push("Duplicate SMS request detected");
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: "Duplicate SMS request detected",
        };
      }

      const record = this.metadataGenerator.buildSmsRecord({
        customerId: input.customerId,
        smsTemplateReference: reference,
        smsCategory: category,
        recipientPhoneNumber: normalizedPhone,
        deliveryStatus: "queued",
      });

      const validation = this.validationEngine.validateSmsRecord(record, config);
      if (validation.decision === "fail") {
        return {
          smsRecords: [],
          templates: [],
          failures: [],
          validation,
          error: validation.errors.join("; "),
        };
      }

      record.validationStatus = validation.decision === "pass" ? "passed" : "partial";
      this.queueManager.enqueue(this.registry, record);
      this.registry.storeSms(record, sendKey);

      appendSceLog({
        event: "sms_creation",
        level: "info",
        details: `SMS ${record.smsRecordId} queued (${category}) for ${input.customerId}`,
      });

      this.recordToTimeline(
        input.customerId,
        `SMS queued (${category}): ${reference}`,
        record.smsRecordId,
      );

      return { smsRecords: [record], templates: [], failures: [], validation, error: null };
    });
  }

  private runAction(
    action: SmsRunReport["action"],
    config: SmsCommunicationEngineConfiguration,
    fn: () => {
      smsRecords: SmsRecord[];
      templates: SmsRunReport["templates"];
      failures: SmsFailure[];
      validation: SmsRunReport["validation"];
      error: string | null;
    },
  ): SmsRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("SMS communication engine not connected");

    const result = fn();
    if (result.error && result.validation.decision !== "fail") {
      result.validation.decision = "fail";
      result.validation.errors.push(result.error);
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      smsRecords: result.smsRecords,
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
