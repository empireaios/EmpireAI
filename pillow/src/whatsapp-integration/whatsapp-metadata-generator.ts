/** R4-06 — WhatsApp metadata generator. */

import {
  WAI_CAPABILITIES,
  WAI_METADATA_VERSION,
  WHATSAPP_INTEGRATION_ID,
} from "./paths.js";
import type {
  EngineState,
  MessageCategory,
  WhatsAppConversation,
  WhatsAppEngineRecord,
  WhatsAppFailure,
  WhatsAppRecord,
  WhatsAppRunReport,
  WhatsAppTemplate,
  WhatsAppValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildWhatsAppEngineRecordId(): string {
  return `wai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWhatsAppRunReportId(): string {
  return `wai-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWhatsAppRecordId(): string {
  return `wai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWhatsAppTemplateId(): string {
  return `wai-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWhatsAppConversationId(): string {
  return `wai-con-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWhatsAppFailureId(): string {
  return `wai-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class WhatsAppMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
  }): WhatsAppEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildWhatsAppEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: WHATSAPP_INTEGRATION_ID,
      engineVersion: WAI_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...WAI_CAPABILITIES],
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  buildWhatsAppRecord(input: {
    customerId: string;
    conversationId: string;
    messageTemplateReference: string;
    messageCategory: MessageCategory;
    recipientPhoneNumber: string;
    deliveryStatus?: WhatsAppRecord["deliveryStatus"];
    readStatus?: WhatsAppRecord["readStatus"];
    validationStatus?: ValidationStatus;
  }): WhatsAppRecord {
    return {
      whatsAppRecordId: buildWhatsAppRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationId: input.conversationId,
      messageTemplateReference: input.messageTemplateReference,
      messageCategory: input.messageCategory,
      recipientPhoneNumber: input.recipientPhoneNumber,
      deliveryStatus: input.deliveryStatus ?? "queued",
      readStatus: input.readStatus ?? "unread",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  buildConversation(input: {
    customerId: string;
    recipientPhoneNumber: string;
    status?: WhatsAppConversation["status"];
  }): WhatsAppConversation {
    return {
      conversationId: buildWhatsAppConversationId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      recipientPhoneNumber: input.recipientPhoneNumber,
      status: input.status ?? "active",
      lastMessageAt: null,
      messageCount: 0,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  buildTemplate(input: {
    templateName: string;
    messageCategory: MessageCategory;
    bodyTemplate: string;
  }): WhatsAppTemplate {
    return {
      templateId: buildWhatsAppTemplateId(),
      timestamp: new Date().toISOString(),
      templateName: input.templateName,
      messageCategory: input.messageCategory,
      bodyTemplate: input.bodyTemplate,
      enabled: true,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  buildFailure(
    whatsAppRecordId: string | null,
    reason: string,
    severity: WhatsAppFailure["severity"],
  ): WhatsAppFailure {
    return {
      failureId: buildWhatsAppFailureId(),
      timestamp: new Date().toISOString(),
      whatsAppRecordId,
      reason,
      severity,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: WhatsAppRunReport["action"];
    engineRecord: WhatsAppEngineRecord;
    whatsAppRecords: WhatsAppRecord[];
    conversations: WhatsAppConversation[];
    templates: WhatsAppTemplate[];
    failures: WhatsAppFailure[];
    validation: WhatsAppValidationReport;
    durationMs: number;
  }): WhatsAppRunReport {
    return {
      whatsAppRunReportId: buildWhatsAppRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      whatsAppRecords: input.whatsAppRecords,
      conversations: input.conversations,
      templates: input.templates,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: WAI_METADATA_VERSION,
    };
  }
}
