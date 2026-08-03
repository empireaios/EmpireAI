import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type GrandKingAdvisoryEngineConfiguration = {
  enabled: boolean;
  advisoryGenerationRulesEnabled: boolean;
  priorityRulesEnabled: boolean;
  recommendationThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true;
  preserveAdvisoryTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_GRAND_KING_ADVISORY_ENGINE_CONFIGURATION: GrandKingAdvisoryEngineConfiguration = {
  enabled: true,
  advisoryGenerationRulesEnabled: true,
  priorityRulesEnabled: true,
  recommendationThreshold: 55,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true,
  preserveAdvisoryTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildGrandKingAdvisoryEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GrandKingAdvisoryEngineConfiguration> = {},
): GrandKingAdvisoryEngineConfiguration {
  let file: Partial<GrandKingAdvisoryEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "grand-king-advisory-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.GRAND_KING_ADVISORY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.GRAND_KING_ADVISORY_RETRY_ATTEMPTS ?? "", 10);
  const threshold = Number.parseInt(process.env.GRAND_KING_ADVISORY_RECOMMENDATION_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_GRAND_KING_ADVISORY_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(threshold) ? { recommendationThreshold: threshold } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true,
    preserveAdvisoryTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
