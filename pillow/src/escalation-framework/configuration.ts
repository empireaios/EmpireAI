import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ESCALATION_CATEGORIES } from "./paths.js";
import type { EscalationRecord } from "./types.js";

export type EscalationFrameworkConfiguration = {
  enabled: boolean;
  detectionRulesEnabled: boolean;
  routingRulesEnabled: boolean;
  trackingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  escalationCategories: string[];
  lowConfidenceThreshold: number;
  repeatedFailureThreshold: number;
  seedEscalations: EscalationRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-22 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverResolveBusinessDisputes: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverReplaceExecutiveJudgement: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveEscalationTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_ESCALATIONS: EscalationRecord[] = [];

export const DEFAULT_ESCALATION_FRAMEWORK_CONFIGURATION: EscalationFrameworkConfiguration = {
  enabled: true,
  detectionRulesEnabled: true,
  routingRulesEnabled: true,
  trackingRulesEnabled: true,
  validationRulesEnabled: true,
  escalationCategories: [...ESCALATION_CATEGORIES],
  lowConfidenceThreshold: 60,
  repeatedFailureThreshold: 3,
  seedEscalations: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWorkerTasks: true,
  neverResolveBusinessDisputes: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverReplaceExecutiveJudgement: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveEscalationTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildEscalationFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EscalationFrameworkConfiguration> = {},
): EscalationFrameworkConfiguration {
  let file: Partial<EscalationFrameworkConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "escalation-framework.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.ESCALATION_FRAMEWORK_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ESCALATION_FRAMEWORK_RETRY_ATTEMPTS ?? "", 10);

  const mergedCategories = Array.from(
    new Set([
      ...DEFAULT_ESCALATION_FRAMEWORK_CONFIGURATION.escalationCategories,
      ...(file.escalationCategories ?? []),
      ...(overrides.escalationCategories ?? []),
    ]),
  );

  return {
    ...DEFAULT_ESCALATION_FRAMEWORK_CONFIGURATION,
    ...file,
    ...overrides,
    escalationCategories: mergedCategories,
    seedEscalations: (overrides.seedEscalations ?? file.seedEscalations ?? []).map((r) => ({
      ...r,
      relatedWorkers: [...r.relatedWorkers],
      currentEvidence: [...r.currentEvidence],
      recommendedActions: [...r.recommendedActions],
      detectedConditions: [...r.detectedConditions],
      riskAssessment: {
        ...r.riskAssessment,
        factors: [...r.riskAssessment.factors],
      },
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverResolveBusinessDisputes: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverReplaceExecutiveJudgement: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveEscalationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
