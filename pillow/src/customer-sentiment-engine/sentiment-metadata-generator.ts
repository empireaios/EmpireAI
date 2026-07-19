/** R4-10 — Sentiment metadata generator. */

import {
  CSE_CAPABILITIES,
  CSE_METADATA_VERSION,
  CUSTOMER_SENTIMENT_ENGINE_ID,
} from "./paths.js";
import type {
  AlertStatus,
  CommunicationChannel,
  EngineState,
  SentimentAlert,
  SentimentCategory,
  SentimentEngineRecord,
  SentimentFailure,
  SentimentRecord,
  SentimentRunReport,
  SentimentTrend,
  SentimentValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildSentimentEngineRecordId(): string {
  return `cse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSentimentRunReportId(): string {
  return `cse-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSentimentRecordId(): string {
  return `cse-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSentimentAlertId(): string {
  return `cse-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSentimentTrendId(): string {
  return `cse-trend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSentimentFailureId(): string {
  return `cse-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SentimentMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    timelineEngineConnected: boolean;
    emailEngineConnected: boolean;
    smsEngineConnected: boolean;
    whatsAppIntegrationConnected: boolean;
    liveChatIntegrationConnected: boolean;
    aiCustomerSupportConnected: boolean;
    ticketManagementEngineConnected: boolean;
  }): SentimentEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildSentimentEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_SENTIMENT_ENGINE_ID,
      engineVersion: CSE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CSE_CAPABILITIES],
      timelineEngineConnected: input.timelineEngineConnected,
      emailEngineConnected: input.emailEngineConnected,
      smsEngineConnected: input.smsEngineConnected,
      whatsAppIntegrationConnected: input.whatsAppIntegrationConnected,
      liveChatIntegrationConnected: input.liveChatIntegrationConnected,
      aiCustomerSupportConnected: input.aiCustomerSupportConnected,
      ticketManagementEngineConnected: input.ticketManagementEngineConnected,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  buildSentimentRecord(input: {
    customerId: string;
    conversationReference: string;
    communicationChannel: CommunicationChannel;
    sentimentScore: number;
    sentimentCategory: SentimentCategory;
    confidenceScore: number;
    alertStatus?: AlertStatus;
    validationStatus?: ValidationStatus;
  }): SentimentRecord {
    return {
      sentimentRecordId: buildSentimentRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationReference: input.conversationReference,
      communicationChannel: input.communicationChannel,
      sentimentScore: input.sentimentScore,
      sentimentCategory: input.sentimentCategory,
      confidenceScore: input.confidenceScore,
      alertStatus: input.alertStatus ?? "none",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  buildAlert(input: {
    sentimentRecordId: string;
    customerId: string;
    alertType: SentimentAlert["alertType"];
    severity: SentimentAlert["severity"];
    message: string;
  }): SentimentAlert {
    return {
      alertId: buildSentimentAlertId(),
      timestamp: new Date().toISOString(),
      sentimentRecordId: input.sentimentRecordId,
      customerId: input.customerId,
      alertType: input.alertType,
      severity: input.severity,
      message: input.message,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  buildTrend(input: {
    customerId: string;
    conversationReference: string;
    averageScore: number;
    trendDirection: SentimentTrend["trendDirection"];
    recordCount: number;
  }): SentimentTrend {
    return {
      trendId: buildSentimentTrendId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      conversationReference: input.conversationReference,
      averageScore: input.averageScore,
      trendDirection: input.trendDirection,
      recordCount: input.recordCount,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  buildFailure(
    sentimentRecordId: string | null,
    reason: string,
    severity: SentimentFailure["severity"],
  ): SentimentFailure {
    return {
      failureId: buildSentimentFailureId(),
      timestamp: new Date().toISOString(),
      sentimentRecordId,
      reason,
      severity,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: SentimentRunReport["action"];
    engineRecord: SentimentEngineRecord;
    sentimentRecords: SentimentRecord[];
    alerts: SentimentAlert[];
    trends: SentimentTrend[];
    failures: SentimentFailure[];
    validation: SentimentValidationReport;
    durationMs: number;
  }): SentimentRunReport {
    return {
      sentimentRunReportId: buildSentimentRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      sentimentRecords: input.sentimentRecords,
      alerts: input.alerts,
      trends: input.trends,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CSE_METADATA_VERSION,
    };
  }
}
