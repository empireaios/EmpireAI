/** R4-16 — Segmentation metadata generator. */

import {
  CSEG_CAPABILITIES,
  CSEG_METADATA_VERSION,
  CUSTOMER_SEGMENTATION_ENGINE_ID,
} from "./paths.js";
import type {
  CustomerSegment,
  EngineState,
  SegmentationEngineRecord,
  SegmentationFailure,
  SegmentationRecord,
  SegmentationRunReport,
  SegmentationValidationReport,
  SegmentChange,
  ValidationStatus,
} from "./types.js";

export function buildSegmentationEngineRecordId(): string {
  return `cseg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSegmentationRunReportId(): string {
  return `cseg-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSegmentationRecordId(): string {
  return `cseg-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerSegmentId(): string {
  return `cseg-seg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSegmentChangeId(): string {
  return `cseg-change-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSegmentationFailureId(): string {
  return `cseg-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class SegmentationMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    sentimentEngineConnected: boolean;
    loyaltyProgrammeEngineConnected: boolean;
    customerRiskEngineConnected: boolean;
    customerLifetimeValueEngineConnected: boolean;
  }): SegmentationEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildSegmentationEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_SEGMENTATION_ENGINE_ID,
      engineVersion: CSEG_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CSEG_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      loyaltyProgrammeEngineConnected: input.loyaltyProgrammeEngineConnected,
      customerRiskEngineConnected: input.customerRiskEngineConnected,
      customerLifetimeValueEngineConnected: input.customerLifetimeValueEngineConnected,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  buildSegment(input: {
    segmentName: string;
    segmentType: CustomerSegment["segmentType"];
    description: string;
  }): CustomerSegment {
    return {
      segmentId: buildCustomerSegmentId(),
      timestamp: new Date().toISOString(),
      segmentName: input.segmentName,
      segmentType: input.segmentType,
      description: input.description,
      active: true,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  buildSegmentationRecord(input: {
    customerId: string;
    assignedSegments: string[];
    behaviourProfile: SegmentationRecord["behaviourProfile"];
    loyaltyTier: string;
    customerValueTier: SegmentationRecord["customerValueTier"];
    riskTier: SegmentationRecord["riskTier"];
    segmentConfidence: number;
    validationStatus: ValidationStatus;
  }): SegmentationRecord {
    return {
      segmentationRecordId: buildSegmentationRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      assignedSegments: input.assignedSegments,
      behaviourProfile: input.behaviourProfile,
      loyaltyTier: input.loyaltyTier,
      customerValueTier: input.customerValueTier,
      riskTier: input.riskTier,
      segmentConfidence: input.segmentConfidence,
      validationStatus: input.validationStatus,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  buildSegmentChange(input: {
    customerId: string;
    segmentationRecordId: string;
    previousSegments: string[];
    newSegments: string[];
  }): SegmentChange {
    return {
      changeId: buildSegmentChangeId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      segmentationRecordId: input.segmentationRecordId,
      previousSegments: input.previousSegments,
      newSegments: input.newSegments,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  buildFailure(input: {
    segmentationRecordId: string | null;
    reason: string;
    severity: SegmentationFailure["severity"];
  }): SegmentationFailure {
    return {
      failureId: buildSegmentationFailureId(),
      timestamp: new Date().toISOString(),
      segmentationRecordId: input.segmentationRecordId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: SegmentationRunReport["action"];
    engineRecord: SegmentationEngineRecord;
    segments: CustomerSegment[];
    segmentationRecords: SegmentationRecord[];
    segmentChanges: SegmentChange[];
    failures: SegmentationFailure[];
    validation: SegmentationValidationReport;
    durationMs: number;
  }): SegmentationRunReport {
    return {
      segmentationRunReportId: buildSegmentationRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      segments: input.segments,
      segmentationRecords: input.segmentationRecords,
      segmentChanges: input.segmentChanges,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CSEG_METADATA_VERSION,
    };
  }

  toMachineReadable(record: SegmentationRecord): Record<string, unknown> {
    return { ...record };
  }
}
