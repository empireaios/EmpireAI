/** R3-05 — Expense metadata generator. */

import { EX_CAPABILITIES, EX_METADATA_VERSION, EXPENSE_ENGINE_ID } from "./paths.js";
import type {
  EngineState,
  ExpenseAggregationSummary,
  ExpenseAnomaly,
  ExpenseEngineRecord,
  ExpenseEngineRunReport,
  ExpenseRecord,
  ExpenseValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildEngineRecordId(): string {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExpenseRunReportId(): string {
  return `ex-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildExpenseRecordId(): string {
  return `ex-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAggregationSummaryId(): string {
  return `ex-agg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ExpenseMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    paymentGatewayConnected: boolean;
    bankingIntegrationConnected: boolean;
    revenueEngineConnected: boolean;
  }): ExpenseEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: EXPENSE_ENGINE_ID,
      engineVersion: EX_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...EX_CAPABILITIES],
      metadataVersion: EX_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      paymentGatewayConnected: input.paymentGatewayConnected,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
      revenueEngineConnected: input.revenueEngineConnected,
    };
  }

  buildExpenseRecord(input: {
    expenseSource: ExpenseRecord["expenseSource"];
    paymentReference: string | null;
    bankingReference: string | null;
    supplierReference: string | null;
    expenseCategory: ExpenseRecord["expenseCategory"];
    expenseAmount: number;
    currency: string;
    expenseStatus: ExpenseRecord["expenseStatus"];
    validationStatus: ValidationStatus;
  }): ExpenseRecord {
    return {
      expenseRecordId: buildExpenseRecordId(),
      timestamp: new Date().toISOString(),
      expenseSource: input.expenseSource,
      paymentReference: input.paymentReference,
      bankingReference: input.bankingReference,
      supplierReference: input.supplierReference,
      expenseCategory: input.expenseCategory,
      expenseAmount: input.expenseAmount,
      currency: input.currency,
      expenseStatus: input.expenseStatus,
      validationStatus: input.validationStatus,
      metadataVersion: EX_METADATA_VERSION,
    };
  }

  buildAggregationSummary(input: {
    records: ExpenseRecord[];
    currency: string;
  }): ExpenseAggregationSummary {
    const byCategory: ExpenseAggregationSummary["byCategory"] = {};
    let totalExpenses = 0;
    let recurringTotal = 0;
    let count = 0;

    for (const record of input.records) {
      if (record.currency !== input.currency) continue;
      totalExpenses += record.expenseAmount;
      count += 1;

      if (record.expenseCategory === "recurring") {
        recurringTotal += record.expenseAmount;
      }

      const cat = record.expenseCategory;
      if (!byCategory[cat]) {
        byCategory[cat] = { totalAmount: 0, count: 0 };
      }
      byCategory[cat].totalAmount += record.expenseAmount;
      byCategory[cat].count += 1;
    }

    return {
      summaryId: buildAggregationSummaryId(),
      timestamp: new Date().toISOString(),
      totalExpenses,
      currency: input.currency,
      totalRecords: count,
      byCategory,
      recurringTotal,
      metadataVersion: EX_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ExpenseEngineRunReport["action"];
    engineRecord: ExpenseEngineRecord;
    expenseRecords: ExpenseRecord[];
    aggregation: ExpenseAggregationSummary | null;
    anomalies: ExpenseAnomaly[];
    validation: ExpenseValidationReport;
    durationMs: number;
  }): ExpenseEngineRunReport {
    return {
      expenseRunReportId: buildExpenseRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      expenseRecords: input.expenseRecords,
      aggregation: input.aggregation,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: EX_METADATA_VERSION,
    };
  }
}
