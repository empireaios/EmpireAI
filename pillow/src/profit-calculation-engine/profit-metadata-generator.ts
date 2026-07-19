/** R3-06 — Profit metadata generator. */

import { PC_CAPABILITIES, PC_METADATA_VERSION, PROFIT_CALCULATION_ENGINE_ID } from "./paths.js";
import type {
  EngineState,
  ProfitAggregationSummary,
  ProfitAnomaly,
  ProfitCalculationRunReport,
  ProfitEngineRecord,
  ProfitRecord,
  ProfitValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildEngineRecordId(): string {
  return `pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildProfitRunReportId(): string {
  return `pc-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildProfitRecordId(): string {
  return `pc-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAggregationSummaryId(): string {
  return `pc-agg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ProfitMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    revenueEngineConnected: boolean;
    expenseEngineConnected: boolean;
  }): ProfitEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: PROFIT_CALCULATION_ENGINE_ID,
      engineVersion: PC_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...PC_CAPABILITIES],
      metadataVersion: PC_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      revenueEngineConnected: input.revenueEngineConnected,
      expenseEngineConnected: input.expenseEngineConnected,
    };
  }

  buildProfitRecord(input: {
    revenueReference: string | null;
    expenseReference: string | null;
    marketplaceReference: string | null;
    supplierReference: string | null;
    productReference: string | null;
    orderReference: string | null;
    grossProfit: number;
    operatingProfit: number;
    netProfit: number;
    profitMargin: number;
    validationStatus: ValidationStatus;
  }): ProfitRecord {
    return {
      profitRecordId: buildProfitRecordId(),
      timestamp: new Date().toISOString(),
      revenueReference: input.revenueReference,
      expenseReference: input.expenseReference,
      marketplaceReference: input.marketplaceReference,
      supplierReference: input.supplierReference,
      productReference: input.productReference,
      orderReference: input.orderReference,
      grossProfit: input.grossProfit,
      operatingProfit: input.operatingProfit,
      netProfit: input.netProfit,
      profitMargin: input.profitMargin,
      validationStatus: input.validationStatus,
      metadataVersion: PC_METADATA_VERSION,
    };
  }

  buildAggregationSummary(input: {
    scope: ProfitAggregationSummary["scope"];
    scopeReference: string | null;
    records: ProfitRecord[];
  }): ProfitAggregationSummary {
    const byMarketplace: ProfitAggregationSummary["byMarketplace"] = {};
    const bySupplier: ProfitAggregationSummary["bySupplier"] = {};
    let grossProfit = 0;
    let operatingProfit = 0;
    let netProfit = 0;

    for (const record of input.records) {
      grossProfit += record.grossProfit;
      operatingProfit += record.operatingProfit;
      netProfit += record.netProfit;

      const marketplace = record.marketplaceReference ?? "unattributed";
      if (!byMarketplace[marketplace]) {
        byMarketplace[marketplace] = { netProfit: 0, profitMargin: 0, count: 0 };
      }
      byMarketplace[marketplace].netProfit += record.netProfit;
      byMarketplace[marketplace].profitMargin += record.profitMargin;
      byMarketplace[marketplace].count += 1;

      const supplier = record.supplierReference ?? "unattributed";
      if (!bySupplier[supplier]) {
        bySupplier[supplier] = { netProfit: 0, profitMargin: 0, count: 0 };
      }
      bySupplier[supplier].netProfit += record.netProfit;
      bySupplier[supplier].profitMargin += record.profitMargin;
      bySupplier[supplier].count += 1;
    }

    const count = input.records.length;
    const profitMargin = count > 0
      ? input.records.reduce((s, r) => s + r.profitMargin, 0) / count
      : 0;

    return {
      summaryId: buildAggregationSummaryId(),
      timestamp: new Date().toISOString(),
      scope: input.scope,
      scopeReference: input.scopeReference,
      grossProfit,
      operatingProfit,
      netProfit,
      profitMargin,
      totalRecords: count,
      byMarketplace,
      bySupplier,
      metadataVersion: PC_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: ProfitCalculationRunReport["action"];
    engineRecord: ProfitEngineRecord;
    profitRecords: ProfitRecord[];
    aggregation: ProfitAggregationSummary | null;
    anomalies: ProfitAnomaly[];
    validation: ProfitValidationReport;
    durationMs: number;
  }): ProfitCalculationRunReport {
    return {
      profitRunReportId: buildProfitRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      profitRecords: input.profitRecords,
      aggregation: input.aggregation,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: PC_METADATA_VERSION,
    };
  }
}
