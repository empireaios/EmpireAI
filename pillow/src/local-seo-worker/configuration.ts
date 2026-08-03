import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LOCAL_SEO_WORKER_IDENTITY,
  LSEO_METADATA_VERSION,
} from "./paths.js";
import type { LocalSeoReport } from "./types.js";

export type LocalSeoWorkerConfiguration = {
  enabled: boolean;
  seoRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: LocalSeoReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-07 hard boundaries — force-locked true. */
  neverPublishWebsites: true;
  neverPurchaseBacklinks: true;
  neverManipulateSearchRankings: true;
  neverModifyLiveGoogleBusinessProfilesAutomatically: true;
  neverModifyUnrelatedPlatformComponents: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverFabricateSeoPerformanceResults: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ708OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LOCAL_SEO_WORKER_CONFIGURATION: LocalSeoWorkerConfiguration = {
  enabled: true,
  seoRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: LOCAL_SEO_WORKER_IDENTITY.workerId,
  workerName: LOCAL_SEO_WORKER_IDENTITY.workerName,
  factory: LOCAL_SEO_WORKER_IDENTITY.factory,
  department: LOCAL_SEO_WORKER_IDENTITY.department,
  role: LOCAL_SEO_WORKER_IDENTITY.role,
  reportingLine: [...LOCAL_SEO_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverPublishWebsites: true,
  neverPurchaseBacklinks: true,
  neverManipulateSearchRankings: true,
  neverModifyLiveGoogleBusinessProfilesAutomatically: true,
  neverModifyUnrelatedPlatformComponents: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverFabricateSeoPerformanceResults: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ708OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildLocalSeoWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalSeoWorkerConfiguration> = {},
): LocalSeoWorkerConfiguration {
  let file: Partial<LocalSeoWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "local-seo-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.LOCAL_SEO_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.LOCAL_SEO_WORKER_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_LOCAL_SEO_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_LOCAL_SEO_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LOCAL_SEO_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPublishWebsites: true,
    neverPurchaseBacklinks: true,
    neverManipulateSearchRankings: true,
    neverModifyLiveGoogleBusinessProfilesAutomatically: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateSeoPerformanceResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ708OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: LocalSeoReport): LocalSeoReport {
  return {
    ...report,
    landingPagesGenerated: report.landingPagesGenerated.map((p) => ({
      ...p,
      headings: [...p.headings],
      bodyOutline: [...p.bodyOutline],
      imageAltText: [...p.imageAltText],
      faq: p.faq.map((f) => ({ ...f })),
      sourceOfferRefs: [...p.sourceOfferRefs],
    })),
    googleBusinessRecommendations: report.googleBusinessRecommendations.map((g) => ({
      ...g,
      secondaryCategorySuggestions: [...g.secondaryCategorySuggestions],
      serviceItems: [...g.serviceItems],
      photoSuggestions: [...g.photoSuggestions],
      postIdeas: [...g.postIdeas],
      napChecklist: [...g.napChecklist],
      sourceOfferRefs: [...g.sourceOfferRefs],
      neverModifyLiveGbpAutomatically: true,
    })),
    localKeywords: report.localKeywords.map((k) => ({
      ...k,
      sourceOfferRefs: [...k.sourceOfferRefs],
    })),
    metadata: report.metadata.map((m) => ({
      ...m,
      sourceOfferRefs: [...m.sourceOfferRefs],
    })),
    structuredDataRecommendations: report.structuredDataRecommendations.map((s) => ({
      ...s,
      jsonLdOutline: { ...s.jsonLdOutline },
      notes: [...s.notes],
      sourceOfferRefs: [...s.sourceOfferRefs],
    })),
    citationRecommendations: report.citationRecommendations.map((c) => ({
      ...c,
      napFields: [...c.napFields],
      sourceOfferRefs: [...c.sourceOfferRefs],
      neverPurchaseBacklinks: true,
    })),
    internalLinkingRecommendations: report.internalLinkingRecommendations.map((l) => ({
      ...l,
    })),
    napConsistencyRecommendations: report.napConsistencyRecommendations.map((n) => ({
      ...n,
      consistencyNotes: [...n.consistencyNotes],
      sourceChannels: [...n.sourceChannels],
    })),
    faqAssets: report.faqAssets.map((f) => ({ ...f })),
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    seoCompletenessStatus: {
      ...report.seoCompletenessStatus,
      checklist: report.seoCompletenessStatus.checklist.map((c) => ({ ...c })),
      outstandingGaps: [...report.seoCompletenessStatus.outstandingGaps],
      neverClaimsLiveRankingOrTraffic: true,
    },
    metadataVersion: report.metadataVersion || LSEO_METADATA_VERSION,
    consumableByQ708: true,
    neverPublishWebsites: true,
    neverPurchaseBacklinks: true,
    neverManipulateSearchRankings: true,
    neverModifyLiveGoogleBusinessProfilesAutomatically: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateSeoPerformanceResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ708OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
