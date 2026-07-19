/** R4-08 — Support metadata generator. */

import {
  ACS_CAPABILITIES,
  ACS_METADATA_VERSION,
  AI_CUSTOMER_SUPPORT_ID,
} from "./paths.js";
import type {
  AiSupportEngineRecord,
  AiSupportFailure,
  AiSupportRecord,
  AiSupportRunReport,
  AiSupportValidationReport,
  CommunicationChannel,
  CustomerContext,
  CustomerIntent,
  EngineState,
  EscalationStatus,
  ResolutionStatus,
  SupportSummary,
  ValidationStatus,
} from "./types.js";

export function buildAiSupportEngineRecordId(): string {
  return `acs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAiSupportRunReportId(): string {
  return `acs-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAiSupportRecordId(): string {
  return `acs-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAiResponseReference(): string {
  return `acs-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildContextId(): string {
  return `acs-ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSummaryId(): string {
  return `acs-sum-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAiSupportFailureId(): string {
  return `acs-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SupportMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    emailEngineConnected: boolean;
    smsEngineConnected: boolean;
    whatsAppIntegrationConnected: boolean;
    liveChatIntegrationConnected: boolean;
  }): AiSupportEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildAiSupportEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: AI_CUSTOMER_SUPPORT_ID,
      engineVersion: ACS_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...ACS_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      emailEngineConnected: input.emailEngineConnected,
      smsEngineConnected: input.smsEngineConnected,
      whatsAppIntegrationConnected: input.whatsAppIntegrationConnected,
      liveChatIntegrationConnected: input.liveChatIntegrationConnected,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  buildAiSupportRecord(input: {
    customerId: string;
    conversationReference: string;
    communicationChannel: CommunicationChannel;
    customerIntent?: CustomerIntent;
    aiResponseReference?: string | null;
    escalationStatus?: EscalationStatus;
    resolutionStatus?: ResolutionStatus;
    validationStatus?: ValidationStatus;
  }): AiSupportRecord {
    return {
      aiSupportRecordId: buildAiSupportRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationReference: input.conversationReference,
      communicationChannel: input.communicationChannel,
      customerIntent: input.customerIntent ?? "general_enquiry",
      aiResponseReference: input.aiResponseReference ?? null,
      escalationStatus: input.escalationStatus ?? "none",
      resolutionStatus: input.resolutionStatus ?? "open",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  buildContext(input: {
    customerId: string;
    crmProfileFound: boolean;
    timelineRecordCount: number;
    recentTimelineEvents: string[];
  }): CustomerContext {
    return {
      contextId: buildContextId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      crmProfileFound: input.crmProfileFound,
      timelineRecordCount: input.timelineRecordCount,
      recentTimelineEvents: input.recentTimelineEvents,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  buildSummary(input: {
    aiSupportRecordId: string;
    customerId: string;
    summaryText: string;
  }): SupportSummary {
    return {
      summaryId: buildSummaryId(),
      timestamp: new Date().toISOString(),
      aiSupportRecordId: input.aiSupportRecordId,
      customerId: input.customerId,
      summaryText: input.summaryText,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  buildFailure(
    aiSupportRecordId: string | null,
    reason: string,
    severity: AiSupportFailure["severity"],
  ): AiSupportFailure {
    return {
      failureId: buildAiSupportFailureId(),
      timestamp: new Date().toISOString(),
      aiSupportRecordId,
      reason,
      severity,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: AiSupportRunReport["action"];
    engineRecord: AiSupportEngineRecord;
    aiSupportRecords: AiSupportRecord[];
    contexts: CustomerContext[];
    summaries: SupportSummary[];
    failures: AiSupportFailure[];
    validation: AiSupportValidationReport;
    durationMs: number;
  }): AiSupportRunReport {
    return {
      aiSupportRunReportId: buildAiSupportRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      aiSupportRecords: input.aiSupportRecords,
      contexts: input.contexts,
      summaries: input.summaries,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ACS_METADATA_VERSION,
    };
  }
}
