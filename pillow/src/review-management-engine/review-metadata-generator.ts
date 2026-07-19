/** R4-11 — Review metadata generator. */

import {
  REVIEW_MANAGEMENT_ENGINE_ID,
  RME_CAPABILITIES,
  RME_METADATA_VERSION,
} from "./paths.js";
import type {
  EngineState,
  ReputationAlert,
  ReviewEngineRecord,
  ReviewFailure,
  ReviewRecord,
  ReviewRunReport,
  ReviewSentiment,
  ReviewStatus,
  ReviewTrend,
  ReviewValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildReviewEngineRecordId(): string {
  return `rme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReviewRunReportId(): string {
  return `rme-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReviewRecordId(): string {
  return `rme-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReputationAlertId(): string {
  return `rme-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReviewTrendId(): string {
  return `rme-trend-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReviewFailureId(): string {
  return `rme-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ReviewMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    timelineEngineConnected: boolean;
    sentimentEngineConnected: boolean;
    aiCustomerSupportConnected: boolean;
  }): ReviewEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildReviewEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: REVIEW_MANAGEMENT_ENGINE_ID,
      engineVersion: RME_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...RME_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      aiCustomerSupportConnected: input.aiCustomerSupportConnected,
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  buildReviewRecord(input: {
    customerId: string;
    marketplaceReference: string;
    productReference: string;
    orderReference: string;
    reviewRating: number;
    reviewComment: string;
    reviewSentiment: ReviewSentiment;
    reviewStatus: ReviewStatus;
    validationStatus?: ValidationStatus;
  }): ReviewRecord {
    return {
      reviewRecordId: buildReviewRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      marketplaceReference: input.marketplaceReference,
      productReference: input.productReference,
      orderReference: input.orderReference,
      reviewRating: input.reviewRating,
      reviewComment: input.reviewComment,
      reviewSentiment: input.reviewSentiment,
      reviewStatus: input.reviewStatus,
      alertStatus: "none",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  buildAlert(input: {
    reviewRecordId: string;
    customerId: string;
    alertType: ReputationAlert["alertType"];
    severity: ReputationAlert["severity"];
    message: string;
  }): ReputationAlert {
    return {
      alertId: buildReputationAlertId(),
      timestamp: new Date().toISOString(),
      reviewRecordId: input.reviewRecordId,
      customerId: input.customerId,
      alertType: input.alertType,
      severity: input.severity,
      message: input.message,
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  buildTrend(input: {
    marketplaceReference: string;
    productReference: string;
    averageRating: number;
    averageSentimentScore: number;
    trendDirection: ReviewTrend["trendDirection"];
    recordCount: number;
  }): ReviewTrend {
    return {
      trendId: buildReviewTrendId(),
      timestamp: new Date().toISOString(),
      marketplaceReference: input.marketplaceReference,
      productReference: input.productReference,
      averageRating: input.averageRating,
      averageSentimentScore: input.averageSentimentScore,
      trendDirection: input.trendDirection,
      recordCount: input.recordCount,
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  buildFailure(
    reviewRecordId: string | null,
    reason: string,
    severity: ReviewFailure["severity"],
  ): ReviewFailure {
    return {
      failureId: buildReviewFailureId(),
      timestamp: new Date().toISOString(),
      reviewRecordId,
      reason,
      severity,
      metadataVersion: RME_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ReviewRunReport["action"];
    engineRecord: ReviewEngineRecord;
    reviewRecords: ReviewRecord[];
    alerts: ReputationAlert[];
    trends: ReviewTrend[];
    failures: ReviewFailure[];
    validation: ReviewValidationReport;
    durationMs: number;
  }): ReviewRunReport {
    return {
      reviewRunReportId: buildReviewRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      reviewRecords: input.reviewRecords,
      alerts: input.alerts,
      trends: input.trends,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RME_METADATA_VERSION,
    };
  }
}
