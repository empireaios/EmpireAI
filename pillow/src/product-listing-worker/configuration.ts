import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  MARKETPLACE_TARGETS,
  PLW_METADATA_VERSION,
  PRODUCT_LISTING_WORKER_IDENTITY,
} from "./paths.js";
import type { ProductListingReport } from "./types.js";

export type ProductListingWorkerConfiguration = {
  enabled: boolean;
  listingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  marketplaceTargets: string[];
  maxTitleLength: number;
  maxBulletPoints: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedListings: ProductListingReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-08 hard boundaries — force-locked true. */
  neverPublishListings: true;
  neverModifySupplierInformation: true;
  neverModifyPricing: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ309OrLater: true;
  preserveProductTraceability: true;
  preserveSupplierReferences: true;
  validateRequiredMarketplaceFields: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PRODUCT_LISTING_WORKER_CONFIGURATION: ProductListingWorkerConfiguration =
  {
    enabled: true,
    listingRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    marketplaceTargets: [...MARKETPLACE_TARGETS],
    maxTitleLength: 200,
    maxBulletPoints: 5,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: PRODUCT_LISTING_WORKER_IDENTITY.workerId,
    workerName: PRODUCT_LISTING_WORKER_IDENTITY.workerName,
    factory: PRODUCT_LISTING_WORKER_IDENTITY.factory,
    department: PRODUCT_LISTING_WORKER_IDENTITY.department,
    role: PRODUCT_LISTING_WORKER_IDENTITY.role,
    reportingLine: [...PRODUCT_LISTING_WORKER_IDENTITY.reportingLine],
    seedListings: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverPublishListings: true,
    neverModifySupplierInformation: true,
    neverModifyPricing: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ309OrLater: true,
    preserveProductTraceability: true,
    preserveSupplierReferences: true,
    validateRequiredMarketplaceFields: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildProductListingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductListingWorkerConfiguration> = {},
): ProductListingWorkerConfiguration {
  let file: Partial<ProductListingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "product-listing-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRODUCT_LISTING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PRODUCT_LISTING_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "marketplaceTargets" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PRODUCT_LISTING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PRODUCT_LISTING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    marketplaceTargets: mergeList("marketplaceTargets"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRODUCT_LISTING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedListings: (overrides.seedListings ?? file.seedListings ?? []).map((l) => lockListing(l)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPublishListings: true,
    neverModifySupplierInformation: true,
    neverModifyPricing: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ309OrLater: true,
    preserveProductTraceability: true,
    preserveSupplierReferences: true,
    validateRequiredMarketplaceFields: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockListing(listing: ProductListingReport): ProductListingReport {
  return {
    ...listing,
    bulletPoints: [...listing.bulletPoints],
    attributes: listing.attributes.map((a) => ({ ...a })),
    variants: listing.variants.map((v) => ({
      ...v,
      attributes: v.attributes.map((a) => ({ ...a })),
    })),
    seoFields: {
      ...listing.seoFields,
      searchTerms: [...listing.seoFields.searchTerms],
      backendKeywords: [...listing.seoFields.backendKeywords],
    },
    listingPackage: {
      ...listing.listingPackage,
      fields: { ...listing.listingPackage.fields },
      imageRefs: [...listing.listingPackage.imageRefs],
      neverAutoPublished: true,
    },
    supportingEvidence: listing.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: listing.metadataVersion || PLW_METADATA_VERSION,
    neverPublishListings: true,
    neverModifySupplierInformation: true,
    neverModifyPricing: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ309OrLater: true,
    preserveProductTraceability: true,
    preserveSupplierReferences: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
