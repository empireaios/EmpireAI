/** R4-13 — Return metadata generator. */

import {
  RETURNS_INTELLIGENCE_ENGINE_ID,
  RIE_CAPABILITIES,
  RIE_METADATA_VERSION,
} from "./paths.js";
import type {
  EngineState,
  RecommendedAction,
  ReturnInsight,
  ReturnIntelligenceFailure,
  ReturnIntelligenceRecord,
  ReturnIntelligenceValidationReport,
  ReturnReason,
  ReturnsIntelligenceEngineRecord,
  ReturnsIntelligenceRunReport,
  ValidationStatus,
} from "./types.js";

export function buildReturnsIntelligenceEngineRecordId(): string {
  return `rie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReturnsIntelligenceRunReportId(): string {
  return `rie-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReturnIntelligenceRecordId(): string {
  return `rie-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReturnInsightId(): string {
  return `rie-insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReturnIntelligenceFailureId(): string {
  return `rie-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ReturnMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    aiCustomerSupportConnected: boolean;
    ticketManagementEngineConnected: boolean;
    returnManagementEngineConnected: boolean;
  }): ReturnsIntelligenceEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildReturnsIntelligenceEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: RETURNS_INTELLIGENCE_ENGINE_ID,
      engineVersion: RIE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...RIE_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      aiCustomerSupportConnected: input.aiCustomerSupportConnected,
      ticketManagementEngineConnected: input.ticketManagementEngineConnected,
      returnManagementEngineConnected: input.returnManagementEngineConnected,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  buildReturnIntelligenceRecord(input: {
    customerId: string;
    returnReference: string;
    orderReference: string;
    productReference: string;
    returnReason: ReturnReason;
    returnRiskScore: number;
    recommendedAction: RecommendedAction;
    validationStatus: ValidationStatus;
  }): ReturnIntelligenceRecord {
    return {
      returnIntelligenceId: buildReturnIntelligenceRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      returnReference: input.returnReference,
      orderReference: input.orderReference,
      productReference: input.productReference,
      returnReason: input.returnReason,
      returnRiskScore: input.returnRiskScore,
      recommendedAction: input.recommendedAction,
      validationStatus: input.validationStatus,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  buildInsight(input: {
    customerId: string;
    returnIntelligenceId: string;
    insightType: ReturnInsight["insightType"];
    summary: string;
  }): ReturnInsight {
    return {
      insightId: buildReturnInsightId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      returnIntelligenceId: input.returnIntelligenceId,
      insightType: input.insightType,
      summary: input.summary,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  buildFailure(input: {
    returnIntelligenceId: string | null;
    reason: string;
    severity: ReturnIntelligenceFailure["severity"];
  }): ReturnIntelligenceFailure {
    return {
      failureId: buildReturnIntelligenceFailureId(),
      timestamp: new Date().toISOString(),
      returnIntelligenceId: input.returnIntelligenceId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ReturnsIntelligenceRunReport["action"];
    engineRecord: ReturnsIntelligenceEngineRecord;
    returnIntelligenceRecords: ReturnIntelligenceRecord[];
    insights: ReturnInsight[];
    failures: ReturnIntelligenceFailure[];
    validation: ReturnIntelligenceValidationReport;
    durationMs: number;
  }): ReturnsIntelligenceRunReport {
    return {
      returnsIntelligenceRunReportId: buildReturnsIntelligenceRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      returnIntelligenceRecords: input.returnIntelligenceRecords,
      insights: input.insights,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RIE_METADATA_VERSION,
    };
  }
}
