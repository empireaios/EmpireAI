import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EBW_METADATA_VERSION,
  EBOOK_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
  PRODUCT_TYPES,
} from "./paths.js";
import type { EbookReport } from "./types.js";

export type EbookWorkerConfiguration = {
  enabled: boolean;
  ebookRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultProductType: string;
  supportedProductTypes: string[];
  defaultChapterCount: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedEbooks: EbookReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-03 hard boundaries — force-locked true. */
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProductsToCustomers: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ504OrLater: true;
  followApprovedProductResearch: true;
  followApprovedProductIntent: true;
  produceOriginalContent: true;
  preserveCompleteTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EBOOK_WORKER_CONFIGURATION: EbookWorkerConfiguration = {
  enabled: true,
  ebookRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultProductType: "ebook",
  supportedProductTypes: [...PRODUCT_TYPES],
  defaultChapterCount: 6,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: EBOOK_WORKER_IDENTITY.workerId,
  workerName: EBOOK_WORKER_IDENTITY.workerName,
  factory: EBOOK_WORKER_IDENTITY.factory,
  department: EBOOK_WORKER_IDENTITY.department,
  role: EBOOK_WORKER_IDENTITY.role,
  reportingLine: [...EBOOK_WORKER_IDENTITY.reportingLine],
  seedEbooks: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildSalesPages: true,
  neverProcessPayments: true,
  neverDeliverProductsToCustomers: true,
  neverPublishProductsDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ504OrLater: true,
  followApprovedProductResearch: true,
  followApprovedProductIntent: true,
  produceOriginalContent: true,
  preserveCompleteTraceability: true,
  performSelfReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildEbookWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EbookWorkerConfiguration> = {},
): EbookWorkerConfiguration {
  let file: Partial<EbookWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "ebook-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EBOOK_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EBOOK_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedProductTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_EBOOK_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_EBOOK_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedProductTypes: mergeList("supportedProductTypes"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_EBOOK_WORKER_CONFIGURATION.reportingLine),
    ],
    seedEbooks: (overrides.seedEbooks ?? file.seedEbooks ?? []).map((e) => lockEbook(e)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProductsToCustomers: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ504OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalContent: true,
    preserveCompleteTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockEbook(ebook: EbookReport): EbookReport {
  return {
    ...ebook,
    chapterStructure: ebook.chapterStructure.map((c) => ({ ...c })),
    includedResources: [...ebook.includedResources],
    exportFormats: [...ebook.exportFormats],
    chapters: ebook.chapters.map((c) => ({ ...c })),
    outline: ebook.outline
      ? {
          ...ebook.outline,
          tableOfContents: [...ebook.outline.tableOfContents],
          sections: ebook.outline.sections.map((s) => ({ ...s })),
          learningObjectives: [...ebook.outline.learningObjectives],
        }
      : null,
    selfReviewFindings: ebook.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...ebook.traceabilityRefs],
    preservedDecisions: ebook.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: ebook.metadataVersion || EBW_METADATA_VERSION,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProductsToCustomers: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ504OrLater: true,
    followApprovedProductResearch: true,
    followApprovedProductIntent: true,
    produceOriginalContent: true,
    preserveCompleteTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
