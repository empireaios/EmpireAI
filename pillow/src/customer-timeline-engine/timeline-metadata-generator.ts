/** R4-03 — Timeline metadata generator. */

import {
  CTE_CAPABILITIES,
  CTE_METADATA_VERSION,
  CUSTOMER_TIMELINE_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  TimelineEngineRecord,
  TimelineRecord,
  TimelineRunReport,
  TimelineSearchResult,
  TimelineValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildTimelineEngineRecordId(): string {
  return `cte-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTimelineRunReportId(): string {
  return `cte-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTimelineRecordId(): string {
  return `cte-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildTimelineSearchResultId(): string {
  return `cte-srch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class TimelineMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
  }): TimelineEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildTimelineEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_TIMELINE_ENGINE_ID,
      engineVersion: CTE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CTE_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }

  buildTimelineRecord(input: {
    customerId: string;
    eventType: TimelineRecord["eventType"];
    eventSource: TimelineRecord["eventSource"];
    eventReference: string;
    eventDescription: string;
    eventStatus?: TimelineRecord["eventStatus"];
    validationStatus?: ValidationStatus;
  }): TimelineRecord {
    return {
      timelineRecordId: buildTimelineRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      eventType: input.eventType,
      eventSource: input.eventSource,
      eventReference: input.eventReference,
      eventDescription: input.eventDescription,
      eventStatus: input.eventStatus ?? "recorded",
      validationStatus: input.validationStatus ?? "passed",
      metadataVersion: CTE_METADATA_VERSION,
    };
  }

  buildSearchResult(input: {
    timelineRecordId: string;
    customerId: string;
    matchReason: string;
    relevanceScore: number;
  }): TimelineSearchResult {
    return {
      resultId: buildTimelineSearchResultId(),
      timestamp: new Date().toISOString(),
      timelineRecordId: input.timelineRecordId,
      customerId: input.customerId,
      matchReason: input.matchReason,
      relevanceScore: input.relevanceScore,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: TimelineRunReport["action"];
    engineRecord: TimelineEngineRecord;
    timelineRecords: TimelineRecord[];
    searchResults: TimelineSearchResult[];
    validation: TimelineValidationReport;
    durationMs: number;
  }): TimelineRunReport {
    return {
      timelineRunReportId: buildTimelineRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      timelineRecords: input.timelineRecords,
      searchResults: input.searchResults,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CTE_METADATA_VERSION,
    };
  }
}
