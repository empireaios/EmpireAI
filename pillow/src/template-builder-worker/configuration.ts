import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PRODUCT_TYPES,
  TBW_METADATA_VERSION,
  TEMPLATE_BUILDER_WORKER_IDENTITY,
} from "./paths.js";
import type { TemplateBuilderReport } from "./types.js";

export type TemplateBuilderWorkerConfiguration = {
  enabled: boolean;
  templateRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultProductType: string;
  supportedProductTypes: string[];
  defaultAssetCount: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedTemplateProducts: TemplateBuilderReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-06 hard boundaries — force-locked true. */
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProductsToCustomers: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ507OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalReusableAssets: true;
  preserveCompleteTraceability: true;
  validateUsabilityBeforeSubmission: true;
  performSelfReview: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_TEMPLATE_BUILDER_WORKER_CONFIGURATION: TemplateBuilderWorkerConfiguration = {
  enabled: true,
  templateRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultProductType: "business_templates",
  supportedProductTypes: [...PRODUCT_TYPES],
  defaultAssetCount: 4,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: TEMPLATE_BUILDER_WORKER_IDENTITY.workerId,
  workerName: TEMPLATE_BUILDER_WORKER_IDENTITY.workerName,
  factory: TEMPLATE_BUILDER_WORKER_IDENTITY.factory,
  department: TEMPLATE_BUILDER_WORKER_IDENTITY.department,
  role: TEMPLATE_BUILDER_WORKER_IDENTITY.role,
  reportingLine: [...TEMPLATE_BUILDER_WORKER_IDENTITY.reportingLine],
  seedTemplateProducts: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildSalesPages: true,
  neverProcessPayments: true,
  neverDeliverProductsToCustomers: true,
  neverPublishProductsDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ507OrLater: true,
  followApprovedProductResearch: true,
  followApprovedProductIntent: true,
  produceOriginalReusableAssets: true,
  preserveCompleteTraceability: true,
  validateUsabilityBeforeSubmission: true,
  performSelfReview: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildTemplateBuilderWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TemplateBuilderWorkerConfiguration> = {},
): TemplateBuilderWorkerConfiguration {
  let file: Partial<TemplateBuilderWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "template-builder-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.TEMPLATE_BUILDER_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.TEMPLATE_BUILDER_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedProductTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_TEMPLATE_BUILDER_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_TEMPLATE_BUILDER_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedProductTypes: mergeList("supportedProductTypes"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_TEMPLATE_BUILDER_WORKER_CONFIGURATION.reportingLine),
    ],
    seedTemplateProducts: (overrides.seedTemplateProducts ?? file.seedTemplateProducts ?? []).map(
      (p) => lockTemplateProduct(p),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProductsToCustomers: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ507OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalReusableAssets: true,
    preserveCompleteTraceability: true,
    validateUsabilityBeforeSubmission: true,
    performSelfReview: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockTemplateProduct(product: TemplateBuilderReport): TemplateBuilderReport {
  return {
    ...product,
    templateTypes: [...product.templateTypes],
    includedAssets: [...product.includedAssets],
    supportedFormats: [...product.supportedFormats],
    exportFormats: [...product.exportFormats],
    templates: product.templates.map((t) => ({
      ...t,
      sections: t.sections ? t.sections.map((s) => ({ ...s })) : undefined,
    })),
    planners: product.planners.map((p) => ({
      ...p,
      weeks: p.weeks.map((w) => ({
        ...w,
        tasks: w.tasks.map((task) => ({ ...task })),
      })),
    })),
    spreadsheets: product.spreadsheets.map((s) => ({
      ...s,
      columns: [...s.columns],
      rows: s.rows.map((r) => ({ ...r })),
    })),
    contracts: product.contracts.map((c) => ({
      ...c,
      clauses: c.clauses.map((clause) => ({ ...clause })),
    })),
    forms: product.forms.map((f) => ({
      ...f,
      fields: f.fields.map((field) => ({ ...field })),
    })),
    checklists: product.checklists.map((c) => ({
      ...c,
      items: c.items.map((item) => ({ ...item })),
    })),
    promptLibrary: product.promptLibrary.map((p) => ({ ...p })),
    selfReviewFindings: product.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...product.traceabilityRefs],
    preservedDecisions: product.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: product.metadataVersion || TBW_METADATA_VERSION,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProductsToCustomers: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ507OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalReusableAssets: true,
    preserveCompleteTraceability: true,
    validateUsabilityBeforeSubmission: true,
    performSelfReview: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
