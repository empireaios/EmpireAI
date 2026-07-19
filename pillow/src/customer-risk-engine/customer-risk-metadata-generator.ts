/** R4-14 — Customer Risk metadata generator. */

import {
  CRE_METADATA_VERSION,
  CUSTOMER_RISK_ENGINE_ID,
  CRE_CAPABILITIES,
} from "./paths.js";
import type {
  AlertStatus,
  CustomerRiskAlert,
  CustomerRiskEngineRecord,
  CustomerRiskFailure,
  CustomerRiskRecord,
  CustomerRiskRunReport,
  CustomerRiskValidationReport,
  EngineState,
  RecommendedAction,
  RiskCategory,
  RiskLevel,
  ValidationStatus,
} from "./types.js";

export function buildCustomerRiskEngineRecordId(): string {
  return `cre-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerRiskRunReportId(): string {
  return `cre-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerRiskRecordId(): string {
  return `cre-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerRiskAlertId(): string {
  return `cre-alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildCustomerRiskFailureId(): string {
  return `cre-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class CustomerRiskMetadataGenerator {
  buildEngineRecord(input: {
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    identityEngineConnected: boolean;
    crmFoundationConnected: boolean;
    timelineEngineConnected: boolean;
    ticketManagementEngineConnected: boolean;
    sentimentEngineConnected: boolean;
    reviewManagementEngineConnected: boolean;
    returnsIntelligenceEngineConnected: boolean;
  }): CustomerRiskEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildCustomerRiskEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: CUSTOMER_RISK_ENGINE_ID,
      engineVersion: CRE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...CRE_CAPABILITIES],
      identityEngineConnected: input.identityEngineConnected,
      crmFoundationConnected: input.crmFoundationConnected,
      timelineEngineConnected: input.timelineEngineConnected,
      ticketManagementEngineConnected: input.ticketManagementEngineConnected,
      sentimentEngineConnected: input.sentimentEngineConnected,
      reviewManagementEngineConnected: input.reviewManagementEngineConnected,
      returnsIntelligenceEngineConnected: input.returnsIntelligenceEngineConnected,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }

  buildCustomerRiskRecord(input: {
    customerId: string;
    riskCategory: RiskCategory;
    riskIndicators: string[];
    riskScore: number;
    riskLevel: RiskLevel;
    recommendedAction: RecommendedAction;
    alertStatus: AlertStatus;
    validationStatus: ValidationStatus;
  }): CustomerRiskRecord {
    return {
      customerRiskId: buildCustomerRiskRecordId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      riskCategory: input.riskCategory,
      riskIndicators: input.riskIndicators,
      riskScore: input.riskScore,
      riskLevel: input.riskLevel,
      recommendedAction: input.recommendedAction,
      alertStatus: input.alertStatus,
      validationStatus: input.validationStatus,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }

  buildAlert(input: {
    customerId: string;
    customerRiskId: string;
    alertType: RiskCategory;
    severity: RiskLevel;
    message: string;
  }): CustomerRiskAlert {
    return {
      alertId: buildCustomerRiskAlertId(),
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      customerRiskId: input.customerRiskId,
      alertType: input.alertType,
      severity: input.severity,
      message: input.message,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }

  buildFailure(input: {
    customerRiskId: string | null;
    reason: string;
    severity: CustomerRiskFailure["severity"];
  }): CustomerRiskFailure {
    return {
      failureId: buildCustomerRiskFailureId(),
      timestamp: new Date().toISOString(),
      customerRiskId: input.customerRiskId,
      reason: input.reason,
      severity: input.severity,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: CustomerRiskRunReport["action"];
    engineRecord: CustomerRiskEngineRecord;
    customerRiskRecords: CustomerRiskRecord[];
    alerts: CustomerRiskAlert[];
    failures: CustomerRiskFailure[];
    validation: CustomerRiskValidationReport;
    durationMs: number;
  }): CustomerRiskRunReport {
    return {
      customerRiskRunReportId: buildCustomerRiskRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      customerRiskRecords: input.customerRiskRecords,
      alerts: input.alerts,
      failures: input.failures,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: CRE_METADATA_VERSION,
    };
  }
}
