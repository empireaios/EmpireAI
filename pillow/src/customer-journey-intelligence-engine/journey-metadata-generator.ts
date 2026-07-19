/** R4-17 — Journey metadata generator. */

import {
  CJI_CAPABILITIES,
  CJI_METADATA_VERSION,
  CUSTOMER_JOURNEY_INTELLIGENCE_ID,
} from "./paths.js";
import type {
  EngineState,
  JourneyFailure,
  JourneyInsight,
  JourneyIntelligenceEngineRecord,
  JourneyRecord,
  JourneyRunReport,
  JourneyValidationReport,
  RecommendedJourneyAction,
  ValidationStatus,
  JourneyStage,
  ConversionStatus,
} from "./types.js";

export function buildJourneyEngineRecordId(): string {
  return `cji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildJourneyRunReportId(): string {
  return `cji-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildJourneyRecordId(): string {
  return `cji-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildJourneyInsightId(): string {
  return `cji-insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildJourneyFailureId(): string {
  return `cji-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class JourneyMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    sentimentEngineConnected: boolean;
    customerLifetimeValueEngineConnected: boolean;
    customerSegmentationEngineConnected: boolean;
  }): JourneyIntelligenceEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildJourneyEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_JOURNEY_INTELLIGENCE_ID,
      engineVersion: CJI_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CJI_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      customerLifetimeValueEngineConnected: input.customerLifetimeValueEngineConnected,
      customerSegmentationEngineConnected: input.customerSegmentationEngineConnected,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  buildJourneyRecord(input: {
    customerId: string;
    journeyStage: JourneyStage;
    touchpointReferences: string[];
    conversionStatus: ConversionStatus;
    frictionIndicators: string[];
    journeyScore: number;
    recommendedActions: RecommendedJourneyAction[];
    validationStatus: ValidationStatus;
  }): JourneyRecord {
    return {
      journeyRecordId: buildJourneyRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      journeyStage: input.journeyStage,
      touchpointReferences: input.touchpointReferences,
      conversionStatus: input.conversionStatus,
      frictionIndicators: input.frictionIndicators,
      journeyScore: input.journeyScore,
      recommendedActions: input.recommendedActions,
      validationStatus: input.validationStatus,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  buildInsight(input: {
    customerId: string;
    journeyRecordId: string;
    insightType: JourneyInsight["insightType"];
    message: string;
  }): JourneyInsight {
    return {
      insightId: buildJourneyInsightId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      journeyRecordId: input.journeyRecordId,
      insightType: input.insightType,
      message: input.message,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  buildFailure(input: {
    journeyRecordId: string | null;
    reason: string;
    severity: JourneyFailure["severity"];
  }): JourneyFailure {
    return {
      failureId: buildJourneyFailureId(),
      timestamp: new Date().toISOString(),
      journeyRecordId: input.journeyRecordId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: JourneyRunReport["action"];
    engineRecord: JourneyIntelligenceEngineRecord;
    journeyRecords: JourneyRecord[];
    insights: JourneyInsight[];
    failures: JourneyFailure[];
    validation: JourneyValidationReport;
    durationMs: number;
  }): JourneyRunReport {
    return {
      journeyRunReportId: buildJourneyRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      journeyRecords: input.journeyRecords,
      insights: input.insights,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CJI_METADATA_VERSION,
    };
  }

  toMachineReadable(record: JourneyRecord): Record<string, unknown> {
    return { ...record };
  }
}
