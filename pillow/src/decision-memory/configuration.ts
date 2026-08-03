import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LOOKUP_DIMENSIONS } from "./paths.js";
import type { DecisionRecord } from "./types.js";

export type DecisionMemoryConfiguration = {
  enabled: boolean;
  recordingRulesEnabled: boolean;
  lookupRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  lookupDimensions: string[];
  seedDecisions: DecisionRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-16 hard boundaries — force-locked true. */
  neverMakeDecisions: true;
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveDecisionTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_DECISIONS: DecisionRecord[] = [];

export const DEFAULT_DECISION_MEMORY_CONFIGURATION: DecisionMemoryConfiguration = {
  enabled: true,
  recordingRulesEnabled: true,
  lookupRulesEnabled: true,
  validationRulesEnabled: true,
  lookupDimensions: [...LOOKUP_DIMENSIONS],
  seedDecisions: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverMakeDecisions: true,
  neverExecuteWork: true,
  neverReplaceExecutionMemory: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveDecisionTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildDecisionMemoryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DecisionMemoryConfiguration> = {},
): DecisionMemoryConfiguration {
  let file: Partial<DecisionMemoryConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "decision-memory.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.DECISION_MEMORY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.DECISION_MEMORY_RETRY_ATTEMPTS ?? "", 10);

  const mergedDimensions = Array.from(
    new Set([
      ...DEFAULT_DECISION_MEMORY_CONFIGURATION.lookupDimensions,
      ...(file.lookupDimensions ?? []),
      ...(overrides.lookupDimensions ?? []),
    ]),
  );

  return {
    ...DEFAULT_DECISION_MEMORY_CONFIGURATION,
    ...file,
    ...overrides,
    lookupDimensions: mergedDimensions,
    seedDecisions: (overrides.seedDecisions ?? file.seedDecisions ?? []).map((d) => ({
      ...d,
      alternativeOptions: d.alternativeOptions.map((o) => ({ ...o })),
      supportingEvidence: [...d.supportingEvidence],
      assumptions: [...d.assumptions],
      relatedWorkers: [...d.relatedWorkers],
      riskAssessment: {
        ...d.riskAssessment,
        factors: [...d.riskAssessment.factors],
      },
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverMakeDecisions: true,
    neverExecuteWork: true,
    neverReplaceExecutionMemory: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveDecisionTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
