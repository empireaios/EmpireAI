import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVED_MARKETPLACES,
  APPROVED_SUPPLIER_PLATFORMS,
  DISCOVERY_SOURCES,
  INTEGRATION_TARGETS,
  PDW_METADATA_VERSION,
  PRODUCT_CATEGORIES,
  PRODUCT_DISCOVERY_WORKER_IDENTITY,
} from "./paths.js";
import type { ProductDiscoveryReport } from "./types.js";

export type ProductDiscoveryWorkerConfiguration = {
  enabled: boolean;
  discoveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  approvedMarketplaces: string[];
  approvedSupplierPlatforms: string[];
  discoverySources: string[];
  productCategories: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedDiscoveries: ProductDiscoveryReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-02 hard boundaries — force-locked true. */
  neverEvaluateProducts: true;
  neverRankProducts: true;
  neverSelectSuppliers: true;
  neverBuildListings: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ303OrLater: true;
  useOnlyApprovedDiscoverySources: true;
  preserveSourceTraceability: true;
  preserveAuditHistory: true;
  distinguishFactsFromAssumptions: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PRODUCT_DISCOVERY_WORKER_CONFIGURATION: ProductDiscoveryWorkerConfiguration =
  {
    enabled: true,
    discoveryRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    approvedMarketplaces: [...APPROVED_MARKETPLACES],
    approvedSupplierPlatforms: [...APPROVED_SUPPLIER_PLATFORMS],
    discoverySources: [...DISCOVERY_SOURCES],
    productCategories: [...PRODUCT_CATEGORIES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: PRODUCT_DISCOVERY_WORKER_IDENTITY.workerId,
    workerName: PRODUCT_DISCOVERY_WORKER_IDENTITY.workerName,
    factory: PRODUCT_DISCOVERY_WORKER_IDENTITY.factory,
    department: PRODUCT_DISCOVERY_WORKER_IDENTITY.department,
    role: PRODUCT_DISCOVERY_WORKER_IDENTITY.role,
    reportingLine: [...PRODUCT_DISCOVERY_WORKER_IDENTITY.reportingLine],
    seedDiscoveries: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverEvaluateProducts: true,
    neverRankProducts: true,
    neverSelectSuppliers: true,
    neverBuildListings: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ303OrLater: true,
    useOnlyApprovedDiscoverySources: true,
    preserveSourceTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromAssumptions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildProductDiscoveryWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductDiscoveryWorkerConfiguration> = {},
): ProductDiscoveryWorkerConfiguration {
  let file: Partial<ProductDiscoveryWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "product-discovery-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PRODUCT_DISCOVERY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.PRODUCT_DISCOVERY_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "approvedMarketplaces"
      | "approvedSupplierPlatforms"
      | "discoverySources"
      | "productCategories"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_PRODUCT_DISCOVERY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PRODUCT_DISCOVERY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    approvedMarketplaces: mergeList("approvedMarketplaces"),
    approvedSupplierPlatforms: mergeList("approvedSupplierPlatforms"),
    discoverySources: mergeList("discoverySources"),
    productCategories: mergeList("productCategories"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PRODUCT_DISCOVERY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedDiscoveries: (overrides.seedDiscoveries ?? file.seedDiscoveries ?? []).map((d) =>
      lockDiscovery(d),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverEvaluateProducts: true,
    neverRankProducts: true,
    neverSelectSuppliers: true,
    neverBuildListings: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ303OrLater: true,
    useOnlyApprovedDiscoverySources: true,
    preserveSourceTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromAssumptions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockDiscovery(discovery: ProductDiscoveryReport): ProductDiscoveryReport {
  return {
    ...discovery,
    searchTrendSignals: [...discovery.searchTrendSignals],
    customerDemandSignals: [...discovery.customerDemandSignals],
    facts: [...discovery.facts],
    assumptions: [...discovery.assumptions],
    supportingEvidence: discovery.supportingEvidence.map((e) => ({ ...e })),
    metadataVersion: discovery.metadataVersion || PDW_METADATA_VERSION,
    neverEvaluateProducts: true,
    neverRankProducts: true,
    neverSelectSuppliers: true,
    neverBuildListings: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ303OrLater: true,
    preserveSourceTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
