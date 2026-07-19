/** R4-18 — Dashboard metadata generator. */

import {
  ECD_CAPABILITIES,
  ECD_METADATA_VERSION,
  EXECUTIVE_CUSTOMER_DASHBOARD_ID,
} from "./paths.js";
import type {
  CustomerDashboardSnapshot,
  DashboardFailure,
  DashboardValidationReport,
  DashboardWidget,
  EngineState,
  ExecutiveCustomerDashboardRecord,
  ExecutiveCustomerDashboardRunReport,
  ValidationStatus,
} from "./types.js";

export function buildDashboardRunReportId(): string {
  return `ecd-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDashboardEngineRecordId(): string {
  return `ecd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDashboardFailureId(): string {
  return `ecd-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DashboardMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    aiCustomerSupportConnected: boolean;
    sentimentEngineConnected: boolean;
    reviewManagementEngineConnected: boolean;
    loyaltyProgrammeEngineConnected: boolean;
    customerRiskEngineConnected: boolean;
    customerLifetimeValueEngineConnected: boolean;
    customerSegmentationEngineConnected: boolean;
    customerJourneyIntelligenceEngineConnected: boolean;
  }): ExecutiveCustomerDashboardRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildDashboardEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_CUSTOMER_DASHBOARD_ID,
      engineVersion: ECD_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...ECD_CAPABILITIES],
      metadataVersion: ECD_METADATA_VERSION,
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      aiCustomerSupportConnected: input.aiCustomerSupportConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      reviewManagementEngineConnected: input.reviewManagementEngineConnected,
      loyaltyProgrammeEngineConnected: input.loyaltyProgrammeEngineConnected,
      customerRiskEngineConnected: input.customerRiskEngineConnected,
      customerLifetimeValueEngineConnected: input.customerLifetimeValueEngineConnected,
      customerSegmentationEngineConnected: input.customerSegmentationEngineConnected,
      customerJourneyIntelligenceEngineConnected: input.customerJourneyIntelligenceEngineConnected,
    };
  }

  buildFailure(input: {
    dashboardId: string | null;
    reason: string;
    severity: DashboardFailure["severity"];
  }): DashboardFailure {
    return {
      failureId: buildDashboardFailureId(),
      timestamp: new Date().toISOString(),
      dashboardId: input.dashboardId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: ECD_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ExecutiveCustomerDashboardRunReport["action"];
    engineRecord: ExecutiveCustomerDashboardRecord;
    snapshots: CustomerDashboardSnapshot[];
    widgets: DashboardWidget[];
    failures: DashboardFailure[];
    validation: DashboardValidationReport;
    durationMs: number;
  }): ExecutiveCustomerDashboardRunReport {
    return {
      dashboardRunReportId: buildDashboardRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      snapshots: input.snapshots,
      widgets: input.widgets,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: ECD_METADATA_VERSION,
    };
  }

  toMachineReadable(snapshot: CustomerDashboardSnapshot): Record<string, unknown> {
    return { ...snapshot };
  }
}
