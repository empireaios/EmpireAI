import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY,
  DPR_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { DigitalProductResearchReport } from "./types.js";

export type DigitalProductResearchWorkerConfiguration = {
  enabled: boolean;
  researchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  criticalOpportunityThreshold: number;
  highOpportunityThreshold: number;
  mediumOpportunityThreshold: number;
  criticalConfidenceThreshold: number;
  highConfidenceThreshold: number;
  mediumConfidenceThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: DigitalProductResearchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q5-02 hard boundaries — force-locked true. */
  neverCreateDigitalProducts: true;
  neverCreateSalesPages: true;
  neverProcessPayments: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedMarketEvidence: true;
  neverImplementQ503OrLater: true;
  useApprovedResearchSourcesOnly: true;
  distinguishFactsFromAssumptions: true;
  preserveCompleteSourceTraceability: true;
  preserveAuditHistory: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_DIGITAL_PRODUCT_RESEARCH_WORKER_CONFIGURATION: DigitalProductResearchWorkerConfiguration =
  {
    enabled: true,
    researchRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    criticalOpportunityThreshold: 85,
    highOpportunityThreshold: 70,
    mediumOpportunityThreshold: 50,
    criticalConfidenceThreshold: 85,
    highConfidenceThreshold: 70,
    mediumConfidenceThreshold: 50,
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.workerId,
    workerName: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.workerName,
    factory: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.factory,
    department: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.department,
    role: DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.role,
    reportingLine: [...DIGITAL_PRODUCT_RESEARCH_WORKER_IDENTITY.reportingLine],
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverCreateDigitalProducts: true,
    neverCreateSalesPages: true,
    neverProcessPayments: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverInventUnsupportedMarketEvidence: true,
    neverImplementQ503OrLater: true,
    useApprovedResearchSourcesOnly: true,
    distinguishFactsFromAssumptions: true,
    preserveCompleteSourceTraceability: true,
    preserveAuditHistory: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildDigitalProductResearchWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DigitalProductResearchWorkerConfiguration> = {},
): DigitalProductResearchWorkerConfiguration {
  let file: Partial<DigitalProductResearchWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "digital-product-research-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.DIGITAL_PRODUCT_RESEARCH_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.DIGITAL_PRODUCT_RESEARCH_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_DIGITAL_PRODUCT_RESEARCH_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_DIGITAL_PRODUCT_RESEARCH_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_DIGITAL_PRODUCT_RESEARCH_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => lockReport(r)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverCreateDigitalProducts: true,
    neverCreateSalesPages: true,
    neverProcessPayments: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverInventUnsupportedMarketEvidence: true,
    neverImplementQ503OrLater: true,
    useApprovedResearchSourcesOnly: true,
    distinguishFactsFromAssumptions: true,
    preserveCompleteSourceTraceability: true,
    preserveAuditHistory: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: DigitalProductResearchReport): DigitalProductResearchReport {
  return {
    ...report,
    customerPainPoints: [...report.customerPainPoints],
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    evidenceKinds: [...report.evidenceKinds],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || DPR_METADATA_VERSION,
    neverCreateDigitalProducts: true,
    neverCreateSalesPages: true,
    neverProcessPayments: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverInventUnsupportedMarketEvidence: true,
    neverImplementQ503OrLater: true,
    useApprovedResearchSourcesOnly: true,
    distinguishFactsFromAssumptions: true,
    preserveCompleteSourceTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
