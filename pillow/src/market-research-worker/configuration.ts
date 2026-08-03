import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BUSINESS_TYPES,
  INTEGRATION_TARGETS,
  MARKET_RESEARCH_WORKER_IDENTITY,
  MRW_METADATA_VERSION,
} from "./paths.js";
import type { MarketResearchReport } from "./types.js";

export type MarketResearchWorkerConfiguration = {
  enabled: boolean;
  researchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  businessTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: MarketResearchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-04 hard boundaries — force-locked true. */
  neverDecideWhetherToBuild: true;
  neverGenerateBranding: true;
  neverBuildMarketingPlans: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ205OrLater: true;
  requireEvidenceBasedFindings: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MARKET_RESEARCH_WORKER_CONFIGURATION: MarketResearchWorkerConfiguration =
  {
    enabled: true,
    researchRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: MARKET_RESEARCH_WORKER_IDENTITY.workerId,
    workerName: MARKET_RESEARCH_WORKER_IDENTITY.workerName,
    factory: MARKET_RESEARCH_WORKER_IDENTITY.factory,
    department: MARKET_RESEARCH_WORKER_IDENTITY.department,
    role: MARKET_RESEARCH_WORKER_IDENTITY.role,
    reportingLine: [...MARKET_RESEARCH_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverDecideWhetherToBuild: true,
    neverGenerateBranding: true,
    neverBuildMarketingPlans: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ205OrLater: true,
    requireEvidenceBasedFindings: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildMarketResearchWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketResearchWorkerConfiguration> = {},
): MarketResearchWorkerConfiguration {
  let file: Partial<MarketResearchWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "market-research-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MARKET_RESEARCH_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.MARKET_RESEARCH_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "businessTypes" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_MARKET_RESEARCH_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_MARKET_RESEARCH_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MARKET_RESEARCH_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) =>
      lockReport(report),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverDecideWhetherToBuild: true,
    neverGenerateBranding: true,
    neverBuildMarketingPlans: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ205OrLater: true,
    requireEvidenceBasedFindings: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: MarketResearchReport): MarketResearchReport {
  return {
    ...report,
    customerProblems: [...report.customerProblems],
    customerSegments: [...report.customerSegments],
    industryTrends: [...report.industryTrends],
    barriersToEntry: [...report.barriersToEntry],
    recommendations: [...report.recommendations],
    missingInformation: [...report.missingInformation],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    competitorAnalysis: report.competitorAnalysis.map((c) => ({
      ...c,
      strengths: [...c.strengths],
      weaknesses: [...c.weaknesses],
    })),
    risks: report.risks.map((r) => ({ ...r })),
    marketDemand: {
      ...report.marketDemand,
      demandSignals: [...report.marketDemand.demandSignals],
      facts: [...report.marketDemand.facts],
      assumptions: [...report.marketDemand.assumptions],
    },
    marketSize: {
      ...report.marketSize,
      facts: [...report.marketSize.facts],
      assumptions: [...report.marketSize.assumptions],
    },
    opportunitySize: {
      ...report.opportunitySize,
      facts: [...report.opportunitySize.facts],
      assumptions: [...report.opportunitySize.assumptions],
    },
    metadataVersion: report.metadataVersion || MRW_METADATA_VERSION,
    neverDecideWhetherToBuild: true,
    neverGenerateBranding: true,
    neverBuildMarketingPlans: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    evidenceBasedFindings: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
