import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  MARKETPLACE_TARGETS,
  PIW_METADATA_VERSION,
  PRODUCT_IMAGE_WORKER_IDENTITY,
} from "./paths.js";
import type { ProductImageReport } from "./types.js";

export type ProductImageWorkerConfiguration = {
  enabled: boolean;
  imageRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  marketplaceTargets: string[];
  minWidthPx: number;
  minHeightPx: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedImageReports: ProductImageReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-07 hard boundaries — force-locked true. */
  neverPublishListings: true;
  neverGenerateAdvertisements: true;
  neverContactSuppliers: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ308OrLater: true;
  neverOverwriteOriginalSourceAssets: true;
  preserveOriginalSupplierAssets: true;
  maintainSupplierTraceability: true;
  validateMarketplaceCompliance: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PRODUCT_IMAGE_WORKER_CONFIGURATION: ProductImageWorkerConfiguration = {
  enabled: true,
  imageRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  marketplaceTargets: [...MARKETPLACE_TARGETS],
  minWidthPx: 1000,
  minHeightPx: 1000,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PRODUCT_IMAGE_WORKER_IDENTITY.workerId,
  workerName: PRODUCT_IMAGE_WORKER_IDENTITY.workerName,
  factory: PRODUCT_IMAGE_WORKER_IDENTITY.factory,
  department: PRODUCT_IMAGE_WORKER_IDENTITY.department,
  role: PRODUCT_IMAGE_WORKER_IDENTITY.role,
  reportingLine: [...PRODUCT_IMAGE_WORKER_IDENTITY.reportingLine],
  seedImageReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPublishListings: true,
  neverGenerateAdvertisements: true,
  neverContactSuppliers: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ308OrLater: true,
  neverOverwriteOriginalSourceAssets: true,
  preserveOriginalSupplierAssets: true,
  maintainSupplierTraceability: true,
  validateMarketplaceCompliance: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildProductImageWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductImageWorkerConfiguration> = {},
): ProductImageWorkerConfiguration {
  let file: Partial<ProductImageWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "product-image-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRODUCT_IMAGE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PRODUCT_IMAGE_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "marketplaceTargets" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PRODUCT_IMAGE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PRODUCT_IMAGE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    marketplaceTargets: mergeList("marketplaceTargets"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRODUCT_IMAGE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedImageReports: (overrides.seedImageReports ?? file.seedImageReports ?? []).map((r) =>
      lockReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPublishListings: true,
    neverGenerateAdvertisements: true,
    neverContactSuppliers: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ308OrLater: true,
    neverOverwriteOriginalSourceAssets: true,
    preserveOriginalSupplierAssets: true,
    maintainSupplierTraceability: true,
    validateMarketplaceCompliance: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: ProductImageReport): ProductImageReport {
  return {
    ...report,
    sourceImages: report.sourceImages.map((s) => ({ ...s })),
    processedImages: report.processedImages.map((p) => ({
      ...p,
      qualityNotes: [...p.qualityNotes],
      originalPreserved: true,
    })),
    imageVariants: report.imageVariants.map((v) => ({ ...v })),
    marketplaceTargets: [...report.marketplaceTargets],
    duplicateImageIds: [...report.duplicateImageIds],
    unusableImageIds: [...report.unusableImageIds],
    preservedMetadata: report.preservedMetadata.map((m) => ({ ...m })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || PIW_METADATA_VERSION,
    neverPublishListings: true,
    neverGenerateAdvertisements: true,
    neverContactSuppliers: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ308OrLater: true,
    neverOverwriteOriginalSourceAssets: true,
    preserveOriginalSupplierAssets: true,
    maintainSupplierTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
