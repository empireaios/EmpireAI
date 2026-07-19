/** R3-10 — Refund metadata generator. */

import {
  RF_CAPABILITIES,
  RF_METADATA_VERSION,
  REFUND_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  RefundAnomaly,
  RefundEngineRecord,
  RefundEngineRunReport,
  RefundRecord,
  RefundValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildRefundEngineRecordId(): string {
  return `rf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRefundRunReportId(): string {
  return `rf-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRefundRecordId(): string {
  return `rf-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RefundMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    paymentGatewayConnected: boolean;
    bankingIntegrationConnected: boolean;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    invoiceGeneratorConnected: boolean;
  }): RefundEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildRefundEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: REFUND_ENGINE_ID,
      engineVersion: RF_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...RF_CAPABILITIES],
      metadataVersion: RF_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      paymentGatewayConnected: input.paymentGatewayConnected,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      invoiceGeneratorConnected: input.invoiceGeneratorConnected,
    };
  }

  buildRefundRecord(input: {
    paymentReference: string;
    bankingReference: string | null;
    invoiceReference: string | null;
    customerReference: string | null;
    orderReference: string | null;
    refundAmount: number;
    currency: string;
    refundReason: string;
    refundStatus: RefundRecord["refundStatus"];
    validationStatus: ValidationStatus;
  }): RefundRecord {
    return {
      refundId: buildRefundRecordId(),
      timestamp: new Date().toISOString(),
      paymentReference: input.paymentReference,
      bankingReference: input.bankingReference,
      invoiceReference: input.invoiceReference,
      customerReference: input.customerReference,
      orderReference: input.orderReference,
      refundAmount: input.refundAmount,
      currency: input.currency,
      refundReason: input.refundReason,
      refundStatus: input.refundStatus,
      validationStatus: input.validationStatus,
      metadataVersion: RF_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: RefundEngineRunReport["action"];
    engineRecord: RefundEngineRecord;
    refundRecords: RefundRecord[];
    anomalies: RefundAnomaly[];
    validation: RefundValidationReport;
    durationMs: number;
  }): RefundEngineRunReport {
    return {
      refundRunReportId: buildRefundRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      refundRecords: input.refundRecords,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RF_METADATA_VERSION,
    };
  }
}
