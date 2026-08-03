import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMPARISON_SITE_WORKER_IDENTITY,
  CSW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { ComparisonSiteReport } from "./types.js";

export type ComparisonSiteWorkerConfiguration = {
  enabled: boolean;
  comparisonRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: ComparisonSiteReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateRankingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRankingsWithoutEvidence: true;
  neverReplaceReviewContentWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ804OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_COMPARISON_SITE_WORKER_CONFIGURATION: ComparisonSiteWorkerConfiguration = {
  enabled: true,
  comparisonRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: COMPARISON_SITE_WORKER_IDENTITY.workerId,
  workerName: COMPARISON_SITE_WORKER_IDENTITY.workerName,
  factory: COMPARISON_SITE_WORKER_IDENTITY.factory,
  department: COMPARISON_SITE_WORKER_IDENTITY.department,
  role: COMPARISON_SITE_WORKER_IDENTITY.role,
  reportingLine: [...COMPARISON_SITE_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateRankingsOrProductInformation: true,
  neverPublishWebsites: true,
  neverManipulateRankingsWithoutEvidence: true,
  neverReplaceReviewContentWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ804OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildComparisonSiteWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ComparisonSiteWorkerConfiguration> = {},
): ComparisonSiteWorkerConfiguration {
  let file: Partial<ComparisonSiteWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "comparison-site-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_COMPARISON_SITE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_COMPARISON_SITE_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_COMPARISON_SITE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateRankingsOrProductInformation: true,
    neverPublishWebsites: true,
    neverManipulateRankingsWithoutEvidence: true,
    neverReplaceReviewContentWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ804OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ComparisonSiteReport): ComparisonSiteReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || CSW_METADATA_VERSION,
    productsCompared: report.productsCompared.map((p) => ({
      ...p,
      features: [...(p.features ?? [])],
      pros: [...(p.pros ?? [])],
      cons: [...(p.cons ?? [])],
      specs: { ...(p.specs ?? {}) },
      fabricated: false as const,
    })),
    rankingResults: report.rankingResults.map((r) => ({
      ...r,
      rationale: [...r.rationale],
      fabricated: false as const,
    })),
    comparisonTables: report.comparisonTables.map((t) => ({
      ...t,
      columns: [...t.columns],
      rows: t.rows.map((row) => ({ ...row })),
      fabricated: false as const,
      derivedFromEvidence: true as const,
    })),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    consumableByQ804: true,
    neverFabricateRankingsOrProductInformation: true,
    neverPublishWebsites: true,
    neverManipulateRankingsWithoutEvidence: true,
    neverReplaceReviewContentWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ804OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
