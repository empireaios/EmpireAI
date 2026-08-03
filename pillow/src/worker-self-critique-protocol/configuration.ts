import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CRITIQUE_CHECKS, SUBMISSION_DECISIONS } from "./paths.js";
import type { SelfCritiqueRecord } from "./types.js";

export type WorkerSelfCritiqueProtocolConfiguration = {
  enabled: boolean;
  critiqueRulesEnabled: boolean;
  completenessRulesEnabled: boolean;
  consistencyRulesEnabled: boolean;
  evidenceRulesEnabled: boolean;
  confidenceRulesEnabled: boolean;
  decisionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  critiqueChecks: string[];
  submissionDecisions: string[];
  minCompletenessScore: number;
  minLogicalConsistency: number;
  minFactualConsistency: number;
  minConfidenceToSubmit: number;
  reviseConfidenceCeiling: number;
  seedCritiques: SelfCritiqueRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-28 hard boundaries — force-locked true. */
  neverReplacePeerReviewRuntime: true;
  neverReplaceWorkerQualityStandard: true;
  neverExecuteWorkerTasks: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveCritiqueTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_CRITIQUES: SelfCritiqueRecord[] = [];

export const DEFAULT_WORKER_SELF_CRITIQUE_PROTOCOL_CONFIGURATION: WorkerSelfCritiqueProtocolConfiguration =
  {
    enabled: true,
    critiqueRulesEnabled: true,
    completenessRulesEnabled: true,
    consistencyRulesEnabled: true,
    evidenceRulesEnabled: true,
    confidenceRulesEnabled: true,
    decisionRulesEnabled: true,
    validationRulesEnabled: true,
    critiqueChecks: [...CRITIQUE_CHECKS],
    submissionDecisions: [...SUBMISSION_DECISIONS],
    minCompletenessScore: 70,
    minLogicalConsistency: 70,
    minFactualConsistency: 70,
    minConfidenceToSubmit: 65,
    reviseConfidenceCeiling: 60,
    seedCritiques: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverReplacePeerReviewRuntime: true,
    neverReplaceWorkerQualityStandard: true,
    neverExecuteWorkerTasks: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCritiqueTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildWorkerSelfCritiqueProtocolConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkerSelfCritiqueProtocolConfiguration> = {},
): WorkerSelfCritiqueProtocolConfiguration {
  let file: Partial<WorkerSelfCritiqueProtocolConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "worker-self-critique-protocol.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.WORKER_SELF_CRITIQUE_PROTOCOL_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.WORKER_SELF_CRITIQUE_PROTOCOL_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedChecks = Array.from(
    new Set([
      ...DEFAULT_WORKER_SELF_CRITIQUE_PROTOCOL_CONFIGURATION.critiqueChecks,
      ...(file.critiqueChecks ?? []),
      ...(overrides.critiqueChecks ?? []),
    ]),
  );
  const mergedDecisions = Array.from(
    new Set([
      ...DEFAULT_WORKER_SELF_CRITIQUE_PROTOCOL_CONFIGURATION.submissionDecisions,
      ...(file.submissionDecisions ?? []),
      ...(overrides.submissionDecisions ?? []),
    ]),
  );

  return {
    ...DEFAULT_WORKER_SELF_CRITIQUE_PROTOCOL_CONFIGURATION,
    ...file,
    ...overrides,
    critiqueChecks: mergedChecks,
    submissionDecisions: mergedDecisions,
    seedCritiques: (overrides.seedCritiques ?? file.seedCritiques ?? []).map((r) => ({
      ...r,
      evidenceReview: [...r.evidenceReview],
      weaknessesFound: [...r.weaknessesFound],
      suggestedImprovements: [...r.suggestedImprovements],
      checksPerformed: [...r.checksPerformed],
      checksFailed: [...r.checksFailed],
      assumptionsIdentified: [...r.assumptionsIdentified],
      missingEvidence: [...r.missingEvidence],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverReplacePeerReviewRuntime: true,
    neverReplaceWorkerQualityStandard: true,
    neverExecuteWorkerTasks: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCritiqueTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
