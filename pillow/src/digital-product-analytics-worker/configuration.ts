import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYTICS_TYPES,
  DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY,
  DPA_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { DigitalProductAnalyticsReport } from "./types.js";

export type DigitalProductAnalyticsWorkerConfiguration = {
  enabled: boolean;
  analyticsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultAnalyticsType: string;
  supportedAnalyticsTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedAnalyticsReports: DigitalProductAnalyticsReport[];
  defaultCurrency: string;
  defaultPeriodLabel: string;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-11 hard boundaries — force-locked true. */
  neverEditProducts: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ512OrLater: true;
  neverModifyProductsWithoutPillowApproval: true;
  neverFabricateMetrics: true;
  preserveCompleteDataTraceability: true;
  distinguishMeasuredDataFromRecommendations: true;
  preserveHistoricalAnalytics: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverBypassPillowGovernance: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION: DigitalProductAnalyticsWorkerConfiguration =
  {
    enabled: true,
    analyticsRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    defaultAnalyticsType: "sales_performance",
    supportedAnalyticsTypes: [...ANALYTICS_TYPES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.workerId,
    workerName: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.workerName,
    factory: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.factory,
    department: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.department,
    role: DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.role,
    reportingLine: [...DIGITAL_PRODUCT_ANALYTICS_WORKER_IDENTITY.reportingLine],
    seedAnalyticsReports: [],
    defaultCurrency: "USD",
    defaultPeriodLabel: "last_30_days",
    timeoutMs: 5000,
    loggingLevel: "info",
    neverEditProducts: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ512OrLater: true,
    neverModifyProductsWithoutPillowApproval: true,
    neverFabricateMetrics: true,
    preserveCompleteDataTraceability: true,
    distinguishMeasuredDataFromRecommendations: true,
    preserveHistoricalAnalytics: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverBypassPillowGovernance: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildDigitalProductAnalyticsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DigitalProductAnalyticsWorkerConfiguration> = {},
): DigitalProductAnalyticsWorkerConfiguration {
  let file: Partial<DigitalProductAnalyticsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "digital-product-analytics-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.DIGITAL_PRODUCT_ANALYTICS_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets" | "supportedAnalyticsTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedAnalyticsTypes: mergeList("supportedAnalyticsTypes"),
    defaultAnalyticsType:
      overrides.defaultAnalyticsType ??
      file.defaultAnalyticsType ??
      DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION.defaultAnalyticsType,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_DIGITAL_PRODUCT_ANALYTICS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedAnalyticsReports: (overrides.seedAnalyticsReports ?? file.seedAnalyticsReports ?? []).map(
      (r) => lockAnalyticsReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    neverEditProducts: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ512OrLater: true,
    neverModifyProductsWithoutPillowApproval: true,
    neverFabricateMetrics: true,
    preserveCompleteDataTraceability: true,
    distinguishMeasuredDataFromRecommendations: true,
    preserveHistoricalAnalytics: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverBypassPillowGovernance: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockAnalyticsReport(report: DigitalProductAnalyticsReport): DigitalProductAnalyticsReport {
  return {
    ...report,
    analyticsSteps: report.analyticsSteps.map((s) => ({ ...s })),
    supportedAnalyticsTypes: [...report.supportedAnalyticsTypes],
    improvementRecommendations: report.improvementRecommendations.map((r) => ({
      ...r,
      isRecommendation: true as const,
    })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    customerFeedbackSummary: {
      ...report.customerFeedbackSummary,
      themes: [...report.customerFeedbackSummary.themes],
    },
    metadataVersion: report.metadataVersion || DPA_METADATA_VERSION,
    neverEditProducts: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ512OrLater: true,
    neverModifyProductsWithoutPillowApproval: true,
    neverFabricateMetrics: true,
    preserveCompleteDataTraceability: true,
    distinguishMeasuredDataFromRecommendations: true,
    preserveHistoricalAnalytics: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
