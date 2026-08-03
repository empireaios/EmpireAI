import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ASSET_TYPES,
  DESIGN_WORKER_IDENTITY,
  DW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { DesignWorkerReport } from "./types.js";

export type DesignWorkerConfiguration = {
  enabled: boolean;
  designRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultProductType: string;
  defaultAssetType: string;
  supportedAssetTypes: string[];
  /** Alias of supportedAssetTypes for sibling-pattern consistency. */
  supportedProductTypes: string[];
  defaultAssetCount: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedDesignReports: DesignWorkerReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-07 hard boundaries — force-locked true. */
  neverBuildSalesPages: true;
  neverProcessPayments: true;
  neverDeliverProducts: true;
  neverPublishAssetsDirectly: true;
  neverPublishProductsDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ508OrLater: true;
  followApprovedProductIntent: true;
  produceOriginalVisualAssets: true;
  maintainConsistentBranding: true;
  preserveCompleteTraceability: true;
  performQualityReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DESIGN_WORKER_CONFIGURATION: DesignWorkerConfiguration = {
  enabled: true,
  designRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultProductType: "branding_assets",
  defaultAssetType: "branding_assets",
  supportedAssetTypes: [...ASSET_TYPES],
  supportedProductTypes: [...ASSET_TYPES],
  defaultAssetCount: 3,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: DESIGN_WORKER_IDENTITY.workerId,
  workerName: DESIGN_WORKER_IDENTITY.workerName,
  factory: DESIGN_WORKER_IDENTITY.factory,
  department: DESIGN_WORKER_IDENTITY.department,
  role: DESIGN_WORKER_IDENTITY.role,
  reportingLine: [...DESIGN_WORKER_IDENTITY.reportingLine],
  seedDesignReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverBuildSalesPages: true,
  neverProcessPayments: true,
  neverDeliverProducts: true,
  neverPublishAssetsDirectly: true,
  neverPublishProductsDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ508OrLater: true,
  followApprovedProductIntent: true,
  produceOriginalVisualAssets: true,
  maintainConsistentBranding: true,
  preserveCompleteTraceability: true,
  performQualityReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildDesignWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DesignWorkerConfiguration> = {},
): DesignWorkerConfiguration {
  let file: Partial<DesignWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "design-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.DESIGN_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.DESIGN_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedAssetTypes" | "supportedProductTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_DESIGN_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  const supportedAssetTypes = mergeList("supportedAssetTypes");
  const supportedProductTypes = Array.from(
    new Set([...mergeList("supportedProductTypes"), ...supportedAssetTypes]),
  );
  return {
    ...DEFAULT_DESIGN_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedAssetTypes,
    supportedProductTypes,
    defaultAssetType:
      overrides.defaultAssetType ??
      file.defaultAssetType ??
      overrides.defaultProductType ??
      file.defaultProductType ??
      DEFAULT_DESIGN_WORKER_CONFIGURATION.defaultAssetType,
    defaultProductType:
      overrides.defaultProductType ??
      file.defaultProductType ??
      overrides.defaultAssetType ??
      file.defaultAssetType ??
      DEFAULT_DESIGN_WORKER_CONFIGURATION.defaultProductType,
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_DESIGN_WORKER_CONFIGURATION.reportingLine),
    ],
    seedDesignReports: (overrides.seedDesignReports ?? file.seedDesignReports ?? []).map((r) =>
      lockDesignReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishAssetsDirectly: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ508OrLater: true,
    followApprovedProductIntent: true,
    produceOriginalVisualAssets: true,
    maintainConsistentBranding: true,
    preserveCompleteTraceability: true,
    performQualityReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockDesignReport(report: DesignWorkerReport): DesignWorkerReport {
  return {
    ...report,
    assetTypesCreated: [...report.assetTypesCreated],
    exportFormats: [...report.exportFormats],
    previewAssets: report.previewAssets.map((a) => ({ ...a })),
    mockupAssets: report.mockupAssets.map((a) => ({ ...a })),
    ebookCovers: report.ebookCovers.map((a) => ({ ...a })),
    courseCovers: report.courseCovers.map((a) => ({ ...a })),
    brandingAssets: report.brandingAssets.map((a) => ({ ...a })),
    promotionalGraphics: report.promotionalGraphics.map((a) => ({ ...a })),
    allAssets: report.allAssets.map((a) => ({ ...a })),
    brandingThemeDetails: { ...report.brandingThemeDetails },
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || DW_METADATA_VERSION,
    neverBuildSalesPages: true,
    neverProcessPayments: true,
    neverDeliverProducts: true,
    neverPublishAssetsDirectly: true,
    neverPublishProductsDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ508OrLater: true,
    followApprovedProductIntent: true,
    produceOriginalVisualAssets: true,
    maintainConsistentBranding: true,
    preserveCompleteTraceability: true,
    performQualityReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
