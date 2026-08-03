import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EVALUATION_CRITERIA } from "./paths.js";

export type DecisionEngineConfiguration = {
  enabled: boolean;
  evaluationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  minCandidateOptions: number;
  maxCandidateOptions: number;
  /** Default criteria plus optional future criteria IDs — no redesign required. */
  evaluationCriteria: string[];
  criterionWeights: Record<string, number>;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-05 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverReplaceGrandKingApproval: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveDecisionTraceability: true;
  preserveAuditability: true;
  preserveDecisionIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  business_value: 1.2,
  strategic_alignment: 1.1,
  cost: 1.0,
  complexity: 0.9,
  risk: 1.15,
  time: 0.95,
  resource_requirement: 0.9,
  probability_of_success: 1.2,
};

export const DEFAULT_DECISION_ENGINE_CONFIGURATION: DecisionEngineConfiguration = {
  enabled: true,
  evaluationRulesEnabled: true,
  validationRulesEnabled: true,
  minCandidateOptions: 3,
  maxCandidateOptions: 6,
  evaluationCriteria: [...EVALUATION_CRITERIA],
  criterionWeights: { ...DEFAULT_WEIGHTS },
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverAssignWorkers: true,
  neverApproveActions: true,
  neverOverridePillow: true,
  neverReplaceGrandKingApproval: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveDecisionTraceability: true,
  preserveAuditability: true,
  preserveDecisionIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildDecisionEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DecisionEngineConfiguration> = {},
): DecisionEngineConfiguration {
  let file: Partial<DecisionEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "decision-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.DECISION_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.DECISION_ENGINE_RETRY_ATTEMPTS ?? "", 10);
  const minOpts = Number.parseInt(process.env.DECISION_ENGINE_MIN_OPTIONS ?? "", 10);
  const maxOpts = Number.parseInt(process.env.DECISION_ENGINE_MAX_OPTIONS ?? "", 10);

  const mergedCriteria = Array.from(
    new Set([
      ...DEFAULT_DECISION_ENGINE_CONFIGURATION.evaluationCriteria,
      ...(file.evaluationCriteria ?? []),
      ...(overrides.evaluationCriteria ?? []),
    ]),
  );

  return {
    ...DEFAULT_DECISION_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    evaluationCriteria: mergedCriteria,
    criterionWeights: {
      ...DEFAULT_WEIGHTS,
      ...(file.criterionWeights ?? {}),
      ...(overrides.criterionWeights ?? {}),
    },
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(minOpts) ? { minCandidateOptions: minOpts } : {}),
    ...(Number.isFinite(maxOpts) ? { maxCandidateOptions: maxOpts } : {}),
    neverExecuteWork: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverOverridePillow: true,
    neverReplaceGrandKingApproval: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveDecisionTraceability: true,
    preserveAuditability: true,
    preserveDecisionIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
