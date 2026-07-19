/** R3-08 — Reconciliation metadata generator. */

import {
  RC_CAPABILITIES,
  RC_METADATA_VERSION,
  RECONCILIATION_ENGINE_ID,
} from "./paths.js";
import type {
  EngineState,
  ReconciliationEngineRecord,
  ReconciliationMismatch,
  ReconciliationRecord,
  ReconciliationReport,
  ReconciliationRunReport,
  ReconciliationStatus,
  ReconciliationValidationReport,
  ValidationStatus,
} from "./types.js";
import type { MatchResult } from "./transaction-matching-engine.js";

export function buildEngineRecordId(): string {
  return `rc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReconciliationRunReportId(): string {
  return `rc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReconciliationRecordId(): string {
  return `rc-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReconciliationReportId(): string {
  return `rc-rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ReconciliationMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    paymentGatewayConnected: boolean;
    bankingIntegrationConnected: boolean;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
    cashFlowMonitorConnected: boolean;
  }): ReconciliationEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: RECONCILIATION_ENGINE_ID,
      engineVersion: RC_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...RC_CAPABILITIES],
      metadataVersion: RC_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      paymentGatewayConnected: input.paymentGatewayConnected,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
      cashFlowMonitorConnected: input.cashFlowMonitorConnected,
    };
  }

  buildReconciliationRecord(
    match: MatchResult,
    status: ReconciliationStatus,
  ): ReconciliationRecord {
    return {
      reconciliationRecordId: buildReconciliationRecordId(),
      timestamp: new Date().toISOString(),
      bankingReference: match.bankingReference,
      paymentReference: match.paymentReference,
      revenueReference: match.revenueReference,
      expenseReference: match.expenseReference,
      cashFlowReference: match.cashFlowReference,
      matchedTransactionCount: match.matched,
      unmatchedTransactionCount: match.unmatched,
      differenceAmount: match.differenceAmount,
      reconciliationStatus: status,
      validationStatus: "passed",
      metadataVersion: RC_METADATA_VERSION,
    };
  }

  buildReport(input: {
    scope: string;
    records: ReconciliationRecord[];
  }): ReconciliationReport {
    const totalMatched = input.records.reduce((s, r) => s + r.matchedTransactionCount, 0);
    const totalUnmatched = input.records.reduce((s, r) => s + r.unmatchedTransactionCount, 0);
    const totalDifferenceAmount = input.records.reduce((s, r) => s + r.differenceAmount, 0);
    const reconciliationStatus: ReconciliationStatus =
      totalUnmatched === 0 && totalDifferenceAmount === 0
        ? "matched"
        : totalMatched > 0
          ? "partial"
          : "mismatched";

    return {
      reportId: buildReconciliationReportId(),
      timestamp: new Date().toISOString(),
      scope: input.scope,
      totalMatched,
      totalUnmatched,
      totalDifferenceAmount,
      reconciliationStatus,
      metadataVersion: RC_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ReconciliationRunReport["action"];
    engineRecord: ReconciliationEngineRecord;
    reconciliationRecords: ReconciliationRecord[];
    report: ReconciliationReport | null;
    mismatches: ReconciliationMismatch[];
    validation: ReconciliationValidationReport;
    durationMs: number;
  }): ReconciliationRunReport {
    return {
      reconciliationRunReportId: buildReconciliationRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      reconciliationRecords: input.reconciliationRecords,
      report: input.report,
      mismatches: input.mismatches,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RC_METADATA_VERSION,
    };
  }
}
