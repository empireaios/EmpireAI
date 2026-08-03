import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AFFILIATE_COMPLIANCE_WORKER_IDENTITY,
  ACW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { AffiliateComplianceReport } from "./types.js";

export type AffiliateComplianceWorkerConfiguration = {
  enabled: boolean;
  complianceRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: AffiliateComplianceReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateComplianceResults: true;
  neverProvideUnverifiedLegalConclusions: true;
  neverPublishAffiliateContent: true;
  neverReplaceLegalProfessionals: true;
  neverOverrideProgrammeRequirements: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ809OrLater: true;
  preserveCompleteTraceability: true;
  preserveComplianceAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_AFFILIATE_COMPLIANCE_WORKER_CONFIGURATION: AffiliateComplianceWorkerConfiguration =
  {
    enabled: true,
    complianceRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.workerId,
    workerName: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.workerName,
    factory: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.factory,
    department: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.department,
    role: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.role,
    reportingLine: [...AFFILIATE_COMPLIANCE_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverFabricateComplianceResults: true,
    neverProvideUnverifiedLegalConclusions: true,
    neverPublishAffiliateContent: true,
    neverReplaceLegalProfessionals: true,
    neverOverrideProgrammeRequirements: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ809OrLater: true,
    preserveCompleteTraceability: true,
    preserveComplianceAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildAffiliateComplianceWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AffiliateComplianceWorkerConfiguration> = {},
): AffiliateComplianceWorkerConfiguration {
  let file: Partial<AffiliateComplianceWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "affiliate-compliance-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_AFFILIATE_COMPLIANCE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_AFFILIATE_COMPLIANCE_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_AFFILIATE_COMPLIANCE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateComplianceResults: true,
    neverProvideUnverifiedLegalConclusions: true,
    neverPublishAffiliateContent: true,
    neverReplaceLegalProfessionals: true,
    neverOverrideProgrammeRequirements: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ809OrLater: true,
    preserveCompleteTraceability: true,
    preserveComplianceAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: AffiliateComplianceReport): AffiliateComplianceReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || ACW_METADATA_VERSION,
    policyFindings: report.policyFindings.map((f) => ({
      ...f,
      fabricated: false as const,
      legalConclusion: "not_legal_advice" as const,
    })),
    complianceRisks: report.complianceRisks.map((r) => ({
      ...r,
      fabricated: false as const,
      legalConclusion: "not_legal_advice" as const,
    })),
    recommendedCorrections: report.recommendedCorrections.map((c) => ({
      ...c,
      fabricated: false as const,
      legalConclusion: "not_legal_advice" as const,
    })),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    history: report.history.map((h) => ({ ...h })),
    consumableByQ809: true,
    neverFabricateComplianceResults: true,
    neverProvideUnverifiedLegalConclusions: true,
    neverPublishAffiliateContent: true,
    neverReplaceLegalProfessionals: true,
    neverOverrideProgrammeRequirements: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ809OrLater: true,
    preserveCompleteTraceability: true,
    preserveComplianceAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    legalConclusion: "not_legal_advice",
  };
}
