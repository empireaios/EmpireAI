import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AFFILIATE_OPPORTUNITY_WORKER_IDENTITY,
  AOW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { AffiliateOpportunityReport } from "./types.js";

export type AffiliateOpportunityWorkerConfiguration = {
  enabled: boolean;
  opportunityRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: AffiliateOpportunityReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateCommissionOrDemandData: true;
  neverCreateAffiliateContent: true;
  neverPublishWebsites: true;
  neverJoinAffiliateProgrammesAutomatically: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ803OrLater: true;
  preserveCompleteTraceability: true;
  preserveResearchEvidence: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_AFFILIATE_OPPORTUNITY_WORKER_CONFIGURATION: AffiliateOpportunityWorkerConfiguration =
  {
    enabled: true,
    opportunityRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
    workerName: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerName,
    factory: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.factory,
    department: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.department,
    role: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.role,
    reportingLine: [...AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFabricateCommissionOrDemandData: true,
    neverCreateAffiliateContent: true,
    neverPublishWebsites: true,
    neverJoinAffiliateProgrammesAutomatically: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ803OrLater: true,
    preserveCompleteTraceability: true,
    preserveResearchEvidence: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildAffiliateOpportunityWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AffiliateOpportunityWorkerConfiguration> = {},
): AffiliateOpportunityWorkerConfiguration {
  let file: Partial<AffiliateOpportunityWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "affiliate-opportunity-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain defaults */
    }
  }
  return {
    ...DEFAULT_AFFILIATE_OPPORTUNITY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_AFFILIATE_OPPORTUNITY_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_AFFILIATE_OPPORTUNITY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateCommissionOrDemandData: true,
    neverCreateAffiliateContent: true,
    neverPublishWebsites: true,
    neverJoinAffiliateProgrammesAutomatically: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ803OrLater: true,
    preserveCompleteTraceability: true,
    preserveResearchEvidence: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: AffiliateOpportunityReport): AffiliateOpportunityReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || AOW_METADATA_VERSION,
    programmes: report.programmes.map((p) => ({ ...p, fabricated: false as const })),
    products: report.products.map((p) => ({ ...p, fabricated: false as const })),
    niches: report.niches.map((n) => ({ ...n, fabricated: false as const })),
    commissionComparisons: report.commissionComparisons.map((c) => ({
      ...c,
      comparisonNotes: [...c.comparisonNotes],
      fabricated: false as const,
    })),
    opportunityRanking: report.opportunityRanking.map((r) => ({
      ...r,
      scoreBasis: [...r.scoreBasis],
      fabricated: false as const,
    })),
    risks: report.risks.map((r) => ({ ...r })),
    evidenceSources: [...report.evidenceSources],
    seasonalNotes: [...report.seasonalNotes],
    traceabilityRefs: [...report.traceabilityRefs],
    consumableByQ803: true,
    neverFabricateCommissionOrDemandData: true,
    neverCreateAffiliateContent: true,
    neverPublishWebsites: true,
    neverJoinAffiliateProgrammesAutomatically: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ803OrLater: true,
    preserveCompleteTraceability: true,
    preserveResearchEvidence: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
