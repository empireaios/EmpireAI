import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QUALITY_STANDARDS } from "./paths.js";
import type { QualityRecord } from "./types.js";

export type WorkerQualityStandardConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  confidenceRulesEnabled: boolean;
  evidenceRulesEnabled: boolean;
  assumptionRulesEnabled: boolean;
  limitationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  qualityStandards: string[];
  minConfidenceScore: number;
  requireEvidence: boolean;
  requireAssumptions: boolean;
  requireLimitations: boolean;
  requireStructuredReasoning: boolean;
  requireSelfValidation: boolean;
  seedQualityRecords: QualityRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-27 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverReplaceWorkerImplementations: true;
  neverReplacePeerReviewRuntime: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveQualityTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_QUALITY_RECORDS: QualityRecord[] = [];

export const DEFAULT_WORKER_QUALITY_STANDARD_CONFIGURATION: WorkerQualityStandardConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  confidenceRulesEnabled: true,
  evidenceRulesEnabled: true,
  assumptionRulesEnabled: true,
  limitationRulesEnabled: true,
  governanceRulesEnabled: true,
  qualityStandards: [...QUALITY_STANDARDS],
  minConfidenceScore: 60,
  requireEvidence: true,
  requireAssumptions: true,
  requireLimitations: true,
  requireStructuredReasoning: true,
  requireSelfValidation: true,
  seedQualityRecords: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverReplaceWorkerImplementations: true,
  neverReplacePeerReviewRuntime: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveQualityTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildWorkerQualityStandardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerQualityStandardConfiguration> = {},
): WorkerQualityStandardConfiguration {
  let file: Partial<WorkerQualityStandardConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-quality-standard.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.WORKER_QUALITY_STANDARD_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.WORKER_QUALITY_STANDARD_RETRY_ATTEMPTS ?? "", 10);

  const mergedStandards = Array.from(
    new Set([
      ...DEFAULT_WORKER_QUALITY_STANDARD_CONFIGURATION.qualityStandards,
      ...(file.qualityStandards ?? []),
      ...(overrides.qualityStandards ?? []),
    ]),
  );

  return {
    ...DEFAULT_WORKER_QUALITY_STANDARD_CONFIGURATION,
    ...file,
    ...overrides,
    qualityStandards: mergedStandards,
    seedQualityRecords: (overrides.seedQualityRecords ?? file.seedQualityRecords ?? []).map(
      (r) => ({
        ...r,
        evidence: [...r.evidence],
        assumptions: [...r.assumptions],
        limitations: [...r.limitations],
        standardsChecked: [...r.standardsChecked],
        standardsSatisfied: [...r.standardsSatisfied],
        standardsFailed: [...r.standardsFailed],
      }),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverReplaceWorkerImplementations: true,
    neverReplacePeerReviewRuntime: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveQualityTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
