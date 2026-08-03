import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LOCAL_MARKET_RESEARCH_WORKER_IDENTITY,
  LMRW_METADATA_VERSION,
} from "./paths.js";
import type { LocalMarketResearchReport } from "./types.js";

export type LocalMarketResearchWorkerConfiguration = {
  enabled: boolean;
  researchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: LocalMarketResearchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q7-02 hard boundaries — force-locked true. */
  neverFinalizeServicePackages: true;
  neverSetFinalPrices: true;
  neverMakeLaunchDecisions: true;
  neverBuildBookingSystems: true;
  neverBuildWebsites: true;
  neverContactCustomersOrCompetitorsWithoutApproval: true;
  neverPurchaseDataOrAdvertisingWithoutApproval: true;
  neverFabricateDemandPricingOrCompetitorData: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ703OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeProhibitedPersonalData: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_LOCAL_MARKET_RESEARCH_WORKER_CONFIGURATION: LocalMarketResearchWorkerConfiguration =
  {
    enabled: true,
    researchRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.workerId,
    workerName: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.workerName,
    factory: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.factory,
    department: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.department,
    role: LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.role,
    reportingLine: [...LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFinalizeServicePackages: true,
    neverSetFinalPrices: true,
    neverMakeLaunchDecisions: true,
    neverBuildBookingSystems: true,
    neverBuildWebsites: true,
    neverContactCustomersOrCompetitorsWithoutApproval: true,
    neverPurchaseDataOrAdvertisingWithoutApproval: true,
    neverFabricateDemandPricingOrCompetitorData: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ703OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildLocalMarketResearchWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalMarketResearchWorkerConfiguration> = {},
): LocalMarketResearchWorkerConfiguration {
  let file: Partial<LocalMarketResearchWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "local-market-research-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.LOCAL_MARKET_RESEARCH_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.LOCAL_MARKET_RESEARCH_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_LOCAL_MARKET_RESEARCH_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_LOCAL_MARKET_RESEARCH_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_LOCAL_MARKET_RESEARCH_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverFinalizeServicePackages: true,
    neverSetFinalPrices: true,
    neverMakeLaunchDecisions: true,
    neverBuildBookingSystems: true,
    neverBuildWebsites: true,
    neverContactCustomersOrCompetitorsWithoutApproval: true,
    neverPurchaseDataOrAdvertisingWithoutApproval: true,
    neverFabricateDemandPricingOrCompetitorData: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ703OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: LocalMarketResearchReport): LocalMarketResearchReport {
  return {
    ...report,
    customerSegments: [...report.customerSegments],
    risks: [...report.risks],
    assumptions: [...report.assumptions],
    unknowns: [...report.unknowns],
    recommendedResearchFollowUps: [...report.recommendedResearchFollowUps],
    traceabilityRefs: [...report.traceabilityRefs],
    competitorProfiles: report.competitorProfiles.map((c) => ({
      ...c,
      services: [...c.services],
      channels: [...c.channels],
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
      gaps: [...c.gaps],
    })),
    customerPainPoints: report.customerPainPoints.map((p) => ({
      ...p,
      supportingEvidence: [...p.supportingEvidence],
    })),
    serviceGaps: report.serviceGaps.map((g) => ({
      ...g,
      supportingEvidence: [...g.supportingEvidence],
    })),
    opportunityFindings: report.opportunityFindings.map((o) => ({
      ...o,
      supportingEvidence: [...o.supportingEvidence],
      operationalConsiderations: [...o.operationalConsiderations],
      risks: [...o.risks],
    })),
    evidenceSources: report.evidenceSources.map((e) => ({ ...e })),
    metadataVersion: report.metadataVersion || LMRW_METADATA_VERSION,
    consumableByQ703: true,
    neverFinalizeServicePackages: true,
    neverSetFinalPrices: true,
    neverMakeLaunchDecisions: true,
    neverBuildBookingSystems: true,
    neverBuildWebsites: true,
    neverContactCustomersOrCompetitorsWithoutApproval: true,
    neverPurchaseDataOrAdvertisingWithoutApproval: true,
    neverFabricateDemandPricingOrCompetitorData: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ703OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
