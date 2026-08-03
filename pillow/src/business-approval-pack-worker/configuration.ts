import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BAP_METADATA_VERSION,
  BUSINESS_APPROVAL_PACK_WORKER_IDENTITY,
  BUSINESS_TYPES,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { BusinessApprovalPack } from "./types.js";

export type BusinessApprovalPackWorkerConfiguration = {
  enabled: boolean;
  consolidationRulesEnabled: boolean;
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
  seedPacks: BusinessApprovalPack[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-09 hard boundaries — force-locked true. */
  neverApproveBusiness: true;
  neverLaunchBusiness: true;
  neverModifyPreviousReports: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ210OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  distinguishFactsFromRecommendations: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_BUSINESS_APPROVAL_PACK_WORKER_CONFIGURATION: BusinessApprovalPackWorkerConfiguration =
  {
    enabled: true,
    consolidationRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    businessTypes: [...BUSINESS_TYPES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.workerId,
    workerName: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.workerName,
    factory: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.factory,
    department: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.department,
    role: BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.role,
    reportingLine: [...BUSINESS_APPROVAL_PACK_WORKER_IDENTITY.reportingLine],
    seedPacks: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverApproveBusiness: true,
    neverLaunchBusiness: true,
    neverModifyPreviousReports: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ210OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromRecommendations: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildBusinessApprovalPackWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessApprovalPackWorkerConfiguration> = {},
): BusinessApprovalPackWorkerConfiguration {
  let file: Partial<BusinessApprovalPackWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "business-approval-pack-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.BUSINESS_APPROVAL_PACK_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.BUSINESS_APPROVAL_PACK_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (key: "businessTypes" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_BUSINESS_APPROVAL_PACK_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_BUSINESS_APPROVAL_PACK_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BUSINESS_APPROVAL_PACK_WORKER_CONFIGURATION.reportingLine),
    ],
    seedPacks: (overrides.seedPacks ?? file.seedPacks ?? []).map((p) => lockPack(p)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverApproveBusiness: true,
    neverLaunchBusiness: true,
    neverModifyPreviousReports: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ210OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromRecommendations: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockPack(pack: BusinessApprovalPack): BusinessApprovalPack {
  return {
    ...pack,
    majorOpportunities: [...pack.majorOpportunities],
    majorRisks: [...pack.majorRisks],
    requiredApprovals: [...pack.requiredApprovals],
    outstandingIssues: [...pack.outstandingIssues],
    unresolvedRisks: [...pack.unresolvedRisks],
    requiredGrandKingDecisions: [...pack.requiredGrandKingDecisions],
    supportingEvidence: pack.supportingEvidence.map((e) => ({ ...e })),
    facts: [...pack.facts],
    recommendationsOnly: [...pack.recommendationsOnly],
    assumptions: [...pack.assumptions],
    sourceRefs: { ...pack.sourceRefs },
    preservedDecisions: [...pack.preservedDecisions],
    traceabilityRefs: [...pack.traceabilityRefs],
    metadataVersion: pack.metadataVersion || BAP_METADATA_VERSION,
    neverApproveBusiness: true,
    neverLaunchBusiness: true,
    neverModifyPreviousReports: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    distinguishFactsFromRecommendations: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
