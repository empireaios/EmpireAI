/** R4-05 — SMS metadata generator. */

import {
  SCE_CAPABILITIES,
  SCE_METADATA_VERSION,
  SMS_COMMUNICATION_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  SmsCategory,
  SmsEngineRecord,
  SmsFailure,
  SmsRecord,
  SmsRunReport,
  SmsTemplate,
  SmsValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildSmsEngineRecordId(): string {
  return `sce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSmsRunReportId(): string {
  return `sce-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSmsRecordId(): string {
  return `sce-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSmsTemplateId(): string {
  return `sce-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSmsFailureId(): string {
  return `sce-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SmsMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
  }): SmsEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildSmsEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: SMS_COMMUNICATION_ENGINE_ID,
      engineVersion: SCE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...SCE_CAPABILITIES],
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  buildSmsRecord(input: {
    customerId: string;
    smsTemplateReference: string;
    smsCategory: SmsCategory;
    recipientPhoneNumber: string;
    deliveryStatus?: SmsRecord["deliveryStatus"];
    deliveryTimestamp?: string | null;
    retryCount?: number;
    validationStatus?: ValidationStatus;
  }): SmsRecord {
    return {
      smsRecordId: buildSmsRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      smsTemplateReference: input.smsTemplateReference,
      smsCategory: input.smsCategory,
      recipientPhoneNumber: input.recipientPhoneNumber,
      deliveryStatus: input.deliveryStatus ?? "queued",
      deliveryTimestamp: input.deliveryTimestamp ?? null,
      retryCount: input.retryCount ?? 0,
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  buildTemplate(input: {
    templateName: string;
    smsCategory: SmsCategory;
    bodyTemplate: string;
  }): SmsTemplate {
    return {
      templateId: buildSmsTemplateId(),
      timestamp: new Date().toISOString(),
      templateName: input.templateName,
      smsCategory: input.smsCategory,
      bodyTemplate: input.bodyTemplate,
      enabled: true,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  buildFailure(
    smsRecordId: string | null,
    reason: string,
    severity: SmsFailure["severity"],
  ): SmsFailure {
    return {
      failureId: buildSmsFailureId(),
      timestamp: new Date().toISOString(),
      smsRecordId,
      reason,
      severity,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: SmsRunReport["action"];
    engineRecord: SmsEngineRecord;
    smsRecords: SmsRecord[];
    templates: SmsTemplate[];
    failures: SmsFailure[];
    validation: SmsValidationReport;
    durationMs: number;
  }): SmsRunReport {
    return {
      smsRunReportId: buildSmsRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      smsRecords: input.smsRecords,
      templates: input.templates,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: SCE_METADATA_VERSION,
    };
  }
}
