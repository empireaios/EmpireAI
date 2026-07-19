/** R3-04 — Revenue metadata generator. */

import { RE_CAPABILITIES, RE_METADATA_VERSION, REVENUE_ENGINE_ID } from "./paths.js";
import type {
  EngineState,
  RevenueAggregationSummary,
  RevenueAnomaly,
  RevenueEngineRecord,
  RevenueEngineRunReport,
  RevenueRecord,
  RevenueValidationReport,
  ValidationStatus,
} from "./types.js";

export function buildEngineRecordId(): string {
  return `re-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRevenueRunReportId(): string {
  return `re-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildRevenueRecordId(): string {
  return `re-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildAggregationSummaryId(): string {
  return `re-agg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RevenueMetadataGenerator {
  buildEngineRecord(input: {
    frameworkModuleId: string | null;
    operationalState: EngineState;
    validationStatus: ValidationStatus;
    paymentGatewayConnected: boolean;
    bankingIntegrationConnected: boolean;
  }): RevenueEngineRecord {
    const healthStatus =
      input.operationalState === "failed"
        ? "failed"
        : input.operationalState === "active"
          ? "healthy"
          : "degraded";

    return {
      engineRecordId: buildEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: REVENUE_ENGINE_ID,
      engineVersion: RE_METADATA_VERSION,
      currentOperationalState: input.operationalState,
      healthStatus,
      validationStatus: input.validationStatus,
      supportedCapabilities: [...RE_CAPABILITIES],
      metadataVersion: RE_METADATA_VERSION,
      frameworkModuleId: input.frameworkModuleId,
      paymentGatewayConnected: input.paymentGatewayConnected,
      bankingIntegrationConnected: input.bankingIntegrationConnected,
    };
  }

  buildRevenueRecord(input: {
    revenueSource: RevenueRecord["revenueSource"];
    paymentReference: string | null;
    bankingReference: string | null;
    marketplaceReference: string | null;
    customerReference: string | null;
    businessReference: string | null;
    grossRevenue: number;
    netRevenue: number;
    currency: string;
    revenueStatus: RevenueRecord["revenueStatus"];
    validationStatus: ValidationStatus;
  }): RevenueRecord {
    return {
      revenueRecordId: buildRevenueRecordId(),
      timestamp: new Date().toISOString(),
      revenueSource: input.revenueSource,
      paymentReference: input.paymentReference,
      bankingReference: input.bankingReference,
      marketplaceReference: input.marketplaceReference,
      customerReference: input.customerReference,
      businessReference: input.businessReference,
      grossRevenue: input.grossRevenue,
      netRevenue: input.netRevenue,
      currency: input.currency,
      revenueStatus: input.revenueStatus,
      validationStatus: input.validationStatus,
      metadataVersion: RE_METADATA_VERSION,
    };
  }

  buildAggregationSummary(input: {
    records: RevenueRecord[];
    currency: string;
  }): RevenueAggregationSummary {
    const byMarketplace: RevenueAggregationSummary["byMarketplace"] = {};
    const byBusiness: RevenueAggregationSummary["byBusiness"] = {};

    let grossRevenue = 0;
    let netRevenue = 0;

    for (const record of input.records) {
      if (record.currency !== input.currency) continue;
      grossRevenue += record.grossRevenue;
      netRevenue += record.netRevenue;

      const marketplace = record.marketplaceReference ?? "unattributed";
      if (!byMarketplace[marketplace]) {
        byMarketplace[marketplace] = { grossRevenue: 0, netRevenue: 0, count: 0 };
      }
      byMarketplace[marketplace].grossRevenue += record.grossRevenue;
      byMarketplace[marketplace].netRevenue += record.netRevenue;
      byMarketplace[marketplace].count += 1;

      const business = record.businessReference ?? "default";
      if (!byBusiness[business]) {
        byBusiness[business] = { grossRevenue: 0, netRevenue: 0, count: 0 };
      }
      byBusiness[business].grossRevenue += record.grossRevenue;
      byBusiness[business].netRevenue += record.netRevenue;
      byBusiness[business].count += 1;
    }

    return {
      summaryId: buildAggregationSummaryId(),
      timestamp: new Date().toISOString(),
      grossRevenue,
      netRevenue,
      currency: input.currency,
      totalRecords: input.records.filter((r) => r.currency === input.currency).length,
      byMarketplace,
      byBusiness,
      metadataVersion: RE_METADATA_VERSION,
    };
  }

  buildRunReport(input: {
    action: RevenueEngineRunReport["action"];
    engineRecord: RevenueEngineRecord;
    revenueRecords: RevenueRecord[];
    aggregation: RevenueAggregationSummary | null;
    anomalies: RevenueAnomaly[];
    validation: RevenueValidationReport;
    durationMs: number;
  }): RevenueEngineRunReport {
    return {
      revenueRunReportId: buildRevenueRunReportId(),
      runTimestamp: new Date().toISOString(),
      action: input.action,
      engineRecord: input.engineRecord,
      revenueRecords: input.revenueRecords,
      aggregation: input.aggregation,
      anomalies: input.anomalies,
      validation: input.validation,
      durationMs: input.durationMs,
      metadataVersion: RE_METADATA_VERSION,
    };
  }
}
