import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAW_METADATA_VERSION,
  COMMERCE_ANALYTICS_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { CommerceAnalyticsReport } from "./types.js";

export type CommerceAnalyticsWorkerConfiguration = {
  enabled: boolean;
  analyticsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  highConversionThreshold: number;
  lowConversionThreshold: number;
  highMarginThreshold: number;
  lowMarginThreshold: number;
  lowRefundThreshold: number;
  highRefundThreshold: number;
  significantChangePercent: number;
  defaultPeriodLabel: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: CommerceAnalyticsReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-13 hard boundaries — force-locked true. */
  neverModifyProducts: true;
  neverModifyPricing: true;
  neverModifySuppliers: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ314OrLater: true;
  neverModifyOperationalData: true;
  preserveCompleteTraceability: true;
  preserveHistoricalAnalytics: true;
  distinguishMeasuredFromEstimates: true;
  highlightSignificantChanges: true;
  preserveAuditHistory: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_COMMERCE_ANALYTICS_WORKER_CONFIGURATION: CommerceAnalyticsWorkerConfiguration =
  {
    enabled: true,
    analyticsRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    highConversionThreshold: 0.08,
    lowConversionThreshold: 0.02,
    highMarginThreshold: 20,
    lowMarginThreshold: 10,
    lowRefundThreshold: 0.05,
    highRefundThreshold: 0.15,
    significantChangePercent: 0.2,
    defaultPeriodLabel: "current_period",
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: COMMERCE_ANALYTICS_WORKER_IDENTITY.workerId,
    workerName: COMMERCE_ANALYTICS_WORKER_IDENTITY.workerName,
    factory: COMMERCE_ANALYTICS_WORKER_IDENTITY.factory,
    department: COMMERCE_ANALYTICS_WORKER_IDENTITY.department,
    role: COMMERCE_ANALYTICS_WORKER_IDENTITY.role,
    reportingLine: [...COMMERCE_ANALYTICS_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverModifyProducts: true,
    neverModifyPricing: true,
    neverModifySuppliers: true,
    neverExecuteOptimizations: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ314OrLater: true,
    neverModifyOperationalData: true,
    preserveCompleteTraceability: true,
    preserveHistoricalAnalytics: true,
    distinguishMeasuredFromEstimates: true,
    highlightSignificantChanges: true,
    preserveAuditHistory: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildCommerceAnalyticsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CommerceAnalyticsWorkerConfiguration> = {},
): CommerceAnalyticsWorkerConfiguration {
  let file: Partial<CommerceAnalyticsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "commerce-analytics-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.COMMERCE_ANALYTICS_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.COMMERCE_ANALYTICS_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_COMMERCE_ANALYTICS_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_COMMERCE_ANALYTICS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_COMMERCE_ANALYTICS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) =>
      lockReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverModifyProducts: true,
    neverModifyPricing: true,
    neverModifySuppliers: true,
    neverExecuteOptimizations: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ314OrLater: true,
    neverModifyOperationalData: true,
    preserveCompleteTraceability: true,
    preserveHistoricalAnalytics: true,
    distinguishMeasuredFromEstimates: true,
    highlightSignificantChanges: true,
    preserveAuditHistory: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: CommerceAnalyticsReport): CommerceAnalyticsReport {
  return {
    ...report,
    salesMetrics: {
      ...report.salesMetrics,
      unitsSold: { ...report.salesMetrics.unitsSold },
      revenue: { ...report.salesMetrics.revenue },
      averageOrderValue: { ...report.salesMetrics.averageOrderValue },
    },
    conversionMetrics: {
      sessions: { ...report.conversionMetrics.sessions },
      orders: { ...report.conversionMetrics.orders },
      conversionRate: { ...report.conversionMetrics.conversionRate },
    },
    profitMetrics: {
      grossProfit: { ...report.profitMetrics.grossProfit },
      netProfit: { ...report.profitMetrics.netProfit },
      grossMarginPercent: { ...report.profitMetrics.grossMarginPercent },
      netMarginPercent: { ...report.profitMetrics.netMarginPercent },
    },
    customerIssueMetrics: {
      ...report.customerIssueMetrics,
      issueCount: { ...report.customerIssueMetrics.issueCount },
      issueRate: { ...report.customerIssueMetrics.issueRate },
      topIssueTypes: [...report.customerIssueMetrics.topIssueTypes],
    },
    refundMetrics: {
      refundCount: { ...report.refundMetrics.refundCount },
      refundRate: { ...report.refundMetrics.refundRate },
      refundAmount: { ...report.refundMetrics.refundAmount },
    },
    supplierPerformance: {
      ...report.supplierPerformance,
      onTimeRate: { ...report.supplierPerformance.onTimeRate },
      fulfilmentFailureRate: { ...report.supplierPerformance.fulfilmentFailureRate },
      stockAvailabilityScore: { ...report.supplierPerformance.stockAvailabilityScore },
      overallScore: { ...report.supplierPerformance.overallScore },
    },
    significantChanges: report.significantChanges.map((c) => ({ ...c })),
    improvementOpportunities: report.improvementOpportunities.map((o) => ({ ...o })),
    executiveRecommendations: report.executiveRecommendations.map((r) => ({ ...r })),
    orderReportIds: [...report.orderReportIds],
    refundCaseIds: [...report.refundCaseIds],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || CAW_METADATA_VERSION,
    neverModifyProducts: true,
    neverModifyPricing: true,
    neverModifySuppliers: true,
    neverExecuteOptimizations: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ314OrLater: true,
    neverModifyOperationalData: true,
    preserveCompleteTraceability: true,
    preserveHistoricalAnalytics: true,
    distinguishMeasuredFromEstimates: true,
    highlightSignificantChanges: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
