/** R4-04 — Email metadata generator. */

import {
  ECE_CAPABILITIES,
  ECE_METADATA_VERSION,
  EMAIL_COMMUNICATION_ENGINE_ID,
} from "./paths.js";
import type {
  EmailCategory,
  EmailEngineRecord,
  EmailFailure,
  EmailRecord,
  EmailRunReport,
  EmailTemplate,
  EmailValidationReport,
  EngineState,
  ValidationStatus,
} from "./types.js";

export function buildEmailEngineRecordId(): string {
  return `ece-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEmailRunReportId(): string {
  return `ece-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEmailRecordId(): string {
  return `ece-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEmailTemplateId(): string {
  return `ece-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEmailFailureId(): string {
  return `ece-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class EmailMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
  }): EmailEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildEmailEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: EMAIL_COMMUNICATION_ENGINE_ID,
      engineVersion: ECE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...ECE_CAPABILITIES],
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  buildEmailRecord(input: {
    customerId: string;
    emailTemplateReference: string;
    emailCategory: EmailCategory;
    recipientAddress: string;
    deliveryStatus?: EmailRecord["deliveryStatus"];
    validationStatus?: ValidationStatus;
  }): EmailRecord {
    return {
      emailRecordId: buildEmailRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      emailTemplateReference: input.emailTemplateReference,
      emailCategory: input.emailCategory,
      recipientAddress: input.recipientAddress,
      deliveryStatus: input.deliveryStatus ?? "queued",
      openStatus: "not_opened",
      clickStatus: "not_clicked",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  buildTemplate(input: {
    templateName: string;
    emailCategory: EmailCategory;
    subject: string;
    bodyTemplate: string;
  }): EmailTemplate {
    return {
      templateId: buildEmailTemplateId(),
      timestamp: new Date().toISOString(),
      templateName: input.templateName,
      emailCategory: input.emailCategory,
      subject: input.subject,
      bodyTemplate: input.bodyTemplate,
      enabled: true,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  buildFailure(
    emailRecordId: string | null,
    reason: string,
    severity: EmailFailure["severity"],
  ): EmailFailure {
    return {
      failureId: buildEmailFailureId(),
      timestamp: new Date().toISOString(),
      emailRecordId,
      reason,
      severity,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: EmailRunReport["action"];
    engineRecord: EmailEngineRecord;
    emailRecords: EmailRecord[];
    templates: EmailTemplate[];
    failures: EmailFailure[];
    validation: EmailValidationReport;
    durationMs: number;
  }): EmailRunReport {
    return {
      emailRunReportId: buildEmailRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      emailRecords: input.emailRecords,
      templates: input.templates,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ECE_METADATA_VERSION,
    };
  }
}
