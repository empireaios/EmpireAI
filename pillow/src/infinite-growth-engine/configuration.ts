import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type InfiniteGrowthEngineConfiguration = {
  enabled: boolean;
  growthEvaluationRulesEnabled: boolean;
  sustainabilityRulesEnabled: boolean;
  growthPriorityRulesEnabled: boolean;
  recommendationThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSacrificeConstitutionalGovernanceForGrowth: true;
  neverReduceOperationalQualityToIncreaseGrowth: true;
  preserveGrowthTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_INFINITE_GROWTH_ENGINE_CONFIGURATION: InfiniteGrowthEngineConfiguration = {
  enabled: true,
  growthEvaluationRulesEnabled: true,
  sustainabilityRulesEnabled: true,
  growthPriorityRulesEnabled: true,
  recommendationThreshold: 55,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverSacrificeConstitutionalGovernanceForGrowth: true,
  neverReduceOperationalQualityToIncreaseGrowth: true,
  preserveGrowthTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildInfiniteGrowthEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InfiniteGrowthEngineConfiguration> = {},
): InfiniteGrowthEngineConfiguration {
  let file: Partial<InfiniteGrowthEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "infinite-growth-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.INFINITE_GROWTH_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.INFINITE_GROWTH_RETRY_ATTEMPTS ?? "", 10);
  const threshold = Number.parseInt(process.env.INFINITE_GROWTH_RECOMMENDATION_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_INFINITE_GROWTH_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(threshold) ? { recommendationThreshold: threshold } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverSacrificeConstitutionalGovernanceForGrowth: true,
    neverReduceOperationalQualityToIncreaseGrowth: true,
    preserveGrowthTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
