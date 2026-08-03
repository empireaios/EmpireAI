import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PAGE_TYPES,
  SPW_METADATA_VERSION,
  SALES_PAGE_WORKER_IDENTITY,
} from "./paths.js";
import type { SalesPageReport } from "./types.js";

export type SalesPageWorkerConfiguration = {
  enabled: boolean;
  salesPageRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultPageType: string;
  defaultProductType: string;
  supportedPageTypes: string[];
  /** Alias of supportedPageTypes for sibling-pattern consistency. */
  supportedProductTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedSalesPages: SalesPageReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-08 hard boundaries — force-locked true. */
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishWebsites: true;
  neverPublishPagesDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ509OrLater: true;
  neverFabricateTestimonials: true;
  followApprovedProductInformation: true;
  produceOriginalSalesCopy: true;
  preserveCompleteTraceability: true;
  maintainEmpireAiBrandingStandards: true;
  performQualityReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SALES_PAGE_WORKER_CONFIGURATION: SalesPageWorkerConfiguration = {
  enabled: true,
  salesPageRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultPageType: "product_landing_page",
  defaultProductType: "product_landing_page",
  supportedPageTypes: [...PAGE_TYPES],
  supportedProductTypes: [...PAGE_TYPES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SALES_PAGE_WORKER_IDENTITY.workerId,
  workerName: SALES_PAGE_WORKER_IDENTITY.workerName,
  factory: SALES_PAGE_WORKER_IDENTITY.factory,
  department: SALES_PAGE_WORKER_IDENTITY.department,
  role: SALES_PAGE_WORKER_IDENTITY.role,
  reportingLine: [...SALES_PAGE_WORKER_IDENTITY.reportingLine],
  seedSalesPages: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverProcessPayments: true,
  neverDeliverProducts: true,
  neverPublishWebsites: true,
  neverPublishPagesDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ509OrLater: true,
  neverFabricateTestimonials: true,
  followApprovedProductInformation: true,
  produceOriginalSalesCopy: true,
  preserveCompleteTraceability: true,
  maintainEmpireAiBrandingStandards: true,
  performQualityReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildSalesPageWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SalesPageWorkerConfiguration> = {},
): SalesPageWorkerConfiguration {
  let file: Partial<SalesPageWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "sales-page-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SALES_PAGE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SALES_PAGE_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedPageTypes" | "supportedProductTypes",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_SALES_PAGE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  const supportedPageTypes = mergeList("supportedPageTypes");
  const supportedProductTypes = Array.from(
    new Set([...mergeList("supportedProductTypes"), ...supportedPageTypes]),
  );
  return {
    ...DEFAULT_SALES_PAGE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedPageTypes,
    supportedProductTypes,
    defaultPageType:
      overrides.defaultPageType ??
      file.defaultPageType ??
      overrides.defaultProductType ??
      file.defaultProductType ??
      DEFAULT_SALES_PAGE_WORKER_CONFIGURATION.defaultPageType,
    defaultProductType:
      overrides.defaultProductType ??
      file.defaultProductType ??
      overrides.defaultPageType ??
      file.defaultPageType ??
      DEFAULT_SALES_PAGE_WORKER_CONFIGURATION.defaultProductType,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SALES_PAGE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedSalesPages: (overrides.seedSalesPages ?? file.seedSalesPages ?? []).map((r) =>
      lockSalesPageReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishWebsites: true,
    neverPublishPagesDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ509OrLater: true,
    neverFabricateTestimonials: true,
    followApprovedProductInformation: true,
    produceOriginalSalesCopy: true,
    preserveCompleteTraceability: true,
    maintainEmpireAiBrandingStandards: true,
    performQualityReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockSalesPageReport(report: SalesPageReport): SalesPageReport {
  return {
    ...report,
    landingPageStructure: report.landingPageStructure.map((s) => ({ ...s })),
    sectionsGenerated: [...report.sectionsGenerated],
    assetsReferenced: [...report.assetsReferenced],
    headlines: [...report.headlines],
    featureSections: report.featureSections.map((f) => ({ ...f })),
    pricingPresentation: report.pricingPresentation
      ? {
          ...report.pricingPresentation,
          tiers: report.pricingPresentation.tiers.map((t) => ({
            ...t,
            includes: [...t.includes],
          })),
        }
      : null,
    testimonials: report.testimonials.map((t) => ({ ...t, fabricated: false as const })),
    faqs: report.faqs.map((f) => ({ ...f })),
    ctas: report.ctas.map((c) => ({ ...c })),
    guarantees: report.guarantees.map((g) => ({ ...g })),
    exportFormats: [...report.exportFormats],
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || SPW_METADATA_VERSION,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishWebsites: true,
    neverPublishPagesDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ509OrLater: true,
    neverFabricateTestimonials: true,
    followApprovedProductInformation: true,
    produceOriginalSalesCopy: true,
    preserveCompleteTraceability: true,
    maintainEmpireAiBrandingStandards: true,
    performQualityReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
