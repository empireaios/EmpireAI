import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  MARKETPLACE_TARGETS,
  PRW_METADATA_VERSION,
  PRICING_WORKER_IDENTITY,
} from "./paths.js";
import type { PricingReport } from "./types.js";

export type PricingWorkerConfiguration = {
  enabled: boolean;
  pricingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  marketplaceTargets: string[];
  defaultTargetMarginPercent: number;
  defaultMarketplaceFeePercent: number;
  defaultPaymentFeePercent: number;
  defaultAdvertisingPercent: number;
  defaultShippingCost: number;
  currency: string;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedPricingReports: PricingReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-09 hard boundaries — force-locked true. */
  neverPublishListings: true;
  neverModifySupplierCosts: true;
  neverExecutePromotions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ310OrLater: true;
  neverPublishPricingAutomatically: true;
  preservePricingTraceability: true;
  separateActualFromEstimatedCosts: true;
  explainPricingRationale: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PRICING_WORKER_CONFIGURATION: PricingWorkerConfiguration = {
  enabled: true,
  pricingRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  marketplaceTargets: [...MARKETPLACE_TARGETS],
  defaultTargetMarginPercent: 35,
  defaultMarketplaceFeePercent: 15,
  defaultPaymentFeePercent: 2.9,
  defaultAdvertisingPercent: 10,
  defaultShippingCost: 4.5,
  currency: "USD",
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PRICING_WORKER_IDENTITY.workerId,
  workerName: PRICING_WORKER_IDENTITY.workerName,
  factory: PRICING_WORKER_IDENTITY.factory,
  department: PRICING_WORKER_IDENTITY.department,
  role: PRICING_WORKER_IDENTITY.role,
  reportingLine: [...PRICING_WORKER_IDENTITY.reportingLine],
  seedPricingReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPublishListings: true,
  neverModifySupplierCosts: true,
  neverExecutePromotions: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ310OrLater: true,
  neverPublishPricingAutomatically: true,
  preservePricingTraceability: true,
  separateActualFromEstimatedCosts: true,
  explainPricingRationale: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildPricingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PricingWorkerConfiguration> = {},
): PricingWorkerConfiguration {
  let file: Partial<PricingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "pricing-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRICING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PRICING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "marketplaceTargets" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PRICING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PRICING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    marketplaceTargets: mergeList("marketplaceTargets"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRICING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedPricingReports: (overrides.seedPricingReports ?? file.seedPricingReports ?? []).map(
      (r) => lockReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPublishListings: true,
    neverModifySupplierCosts: true,
    neverExecutePromotions: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ310OrLater: true,
    neverPublishPricingAutomatically: true,
    preservePricingTraceability: true,
    separateActualFromEstimatedCosts: true,
    explainPricingRationale: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: PricingReport): PricingReport {
  return {
    ...report,
    supplierCost: { ...report.supplierCost },
    shippingCost: { ...report.shippingCost },
    marketplaceFees: { ...report.marketplaceFees },
    paymentFees: { ...report.paymentFees },
    advertisingAllocation: { ...report.advertisingAllocation },
    totalLandedCost: { ...report.totalLandedCost },
    targetProfit: { ...report.targetProfit },
    competitorPricing: report.competitorPricing.map((c) => ({ ...c })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || PRW_METADATA_VERSION,
    neverPublishListings: true,
    neverModifySupplierCosts: true,
    neverExecutePromotions: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ310OrLater: true,
    neverPublishPricingAutomatically: true,
    preservePricingTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
