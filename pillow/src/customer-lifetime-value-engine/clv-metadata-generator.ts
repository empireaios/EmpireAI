/** R4-15 — CLV metadata generator. */

import {
  CLVE_CAPABILITIES,
  CLVE_METADATA_VERSION,
  CUSTOMER_LIFETIME_VALUE_ENGINE_ID,
} from "./paths.js";
import type {
  ClvEngineRecord,
  ClvFailure,
  ClvInsight,
  ClvRecord,
  ClvRunReport,
  ClvValidationReport,
  EngineState,
  ValidationStatus,
  ValueTier,
} from "./types.js";

export function buildClvEngineRecordId(): string {
  return `clve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildClvRunReportId(): string {
  return `clve-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildClvRecordId(): string {
  return `clve-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildClvInsightId(): string {
  return `clve-insight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildClvFailureId(): string {
  return `clve-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ClvMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    revenueEngineConnected: boolean;
    profitCalculationEngineConnected: boolean;
    loyaltyProgrammeEngineConnected: boolean;
    customerRiskEngineConnected: boolean;
  }): ClvEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildClvEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_LIFETIME_VALUE_ENGINE_ID,
      engineVersion: CLVE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CLVE_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      revenueEngineConnected: input.revenueEngineConnected,
      profitCalculationEngineConnected: input.profitCalculationEngineConnected,
      loyaltyProgrammeEngineConnected: input.loyaltyProgrammeEngineConnected,
      customerRiskEngineConnected: input.customerRiskEngineConnected,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  buildClvRecord(input: {
    customerId: string;
    revenueContribution: number;
    profitContribution: number;
    purchaseFrequency: number;
    averageOrderValue: number;
    retentionScore: number;
    lifetimeValue: number;
    predictedLifetimeValue: number;
    validationStatus: ValidationStatus;
  }): ClvRecord {
    return {
      clvRecordId: buildClvRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      revenueContribution: input.revenueContribution,
      profitContribution: input.profitContribution,
      purchaseFrequency: input.purchaseFrequency,
      averageOrderValue: input.averageOrderValue,
      retentionScore: input.retentionScore,
      lifetimeValue: input.lifetimeValue,
      predictedLifetimeValue: input.predictedLifetimeValue,
      validationStatus: input.validationStatus,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  buildInsight(input: {
    customerId: string;
    clvRecordId: string;
    insightType: ClvInsight["insightType"];
    valueTier: ValueTier;
    message: string;
  }): ClvInsight {
    return {
      insightId: buildClvInsightId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      clvRecordId: input.clvRecordId,
      insightType: input.insightType,
      valueTier: input.valueTier,
      message: input.message,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  buildFailure(input: {
    clvRecordId: string | null;
    reason: string;
    severity: ClvFailure["severity"];
  }): ClvFailure {
    return {
      failureId: buildClvFailureId(),
      timestamp: new Date().toISOString(),
      clvRecordId: input.clvRecordId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ClvRunReport["action"];
    engineRecord: ClvEngineRecord;
    clvRecords: ClvRecord[];
    insights: ClvInsight[];
    failures: ClvFailure[];
    validation: ClvValidationReport;
    durationMs: number;
  }): ClvRunReport {
    return {
      clvRunReportId: buildClvRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      clvRecords: input.clvRecords,
      insights: input.insights,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CLVE_METADATA_VERSION,
    };
  }

  toMachineReadable(record: ClvRecord): Record<string, unknown> {
    return { ...record };
  }
}
