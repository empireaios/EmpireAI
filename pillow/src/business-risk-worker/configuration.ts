import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BRW_METADATA_VERSION,
  BUSINESS_RISK_WORKER_IDENTITY,
  BUSINESS_TYPES,
  INTEGRATION_TARGETS,
  RISK_CATEGORIES,
} from "./paths.js";
import type { BusinessRiskReport } from "./types.js";

export type BusinessRiskWorkerConfiguration = {
  enabled: boolean;
  assessmentRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  businessTypes: string[];
  riskCategories: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: BusinessRiskReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-08 hard boundaries — force-locked true. */
  neverRemoveRisksAutomatically: true;
  neverApproveBusiness: true;
  neverRejectBusiness: true;
  neverLaunchBusiness: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ209OrLater: true;
  requireEvidenceBasedFindings: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_BUSINESS_RISK_WORKER_CONFIGURATION: BusinessRiskWorkerConfiguration = {
  enabled: true,
  assessmentRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  businessTypes: [...BUSINESS_TYPES],
  riskCategories: [...RISK_CATEGORIES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: BUSINESS_RISK_WORKER_IDENTITY.workerId,
  workerName: BUSINESS_RISK_WORKER_IDENTITY.workerName,
  factory: BUSINESS_RISK_WORKER_IDENTITY.factory,
  department: BUSINESS_RISK_WORKER_IDENTITY.department,
  role: BUSINESS_RISK_WORKER_IDENTITY.role,
  reportingLine: [...BUSINESS_RISK_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRemoveRisksAutomatically: true,
  neverApproveBusiness: true,
  neverRejectBusiness: true,
  neverLaunchBusiness: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ209OrLater: true,
  requireEvidenceBasedFindings: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildBusinessRiskWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessRiskWorkerConfiguration> = {},
): BusinessRiskWorkerConfiguration {
  let file: Partial<BusinessRiskWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "business-risk-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BUSINESS_RISK_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.BUSINESS_RISK_WORKER_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (key: "businessTypes" | "riskCategories" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_BUSINESS_RISK_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_BUSINESS_RISK_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    businessTypes: mergeList("businessTypes"),
    riskCategories: mergeList("riskCategories"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_BUSINESS_RISK_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => lockReport(r)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRemoveRisksAutomatically: true,
    neverApproveBusiness: true,
    neverRejectBusiness: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ209OrLater: true,
    requireEvidenceBasedFindings: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: BusinessRiskReport): BusinessRiskReport {
  return {
    ...report,
    risks: report.risks.map((risk) => ({
      ...risk,
      supportingEvidence: risk.supportingEvidence.map((e) => ({ ...e })),
    })),
    prioritizedRiskIds: [...report.prioritizedRiskIds],
    facts: [...report.facts],
    assumptions: [...report.assumptions],
    missingInformation: [...report.missingInformation],
    preservedDecisions: [...report.preservedDecisions],
    traceabilityRefs: [...report.traceabilityRefs],
    metadataVersion: report.metadataVersion || BRW_METADATA_VERSION,
    neverRemoveRisksAutomatically: true,
    neverApproveBusiness: true,
    neverRejectBusiness: true,
    neverLaunchBusiness: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    evidenceBasedFindings: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
