import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { RECOMMENDATION_CATEGORIES } from "./paths.js";

export type StrategicRecommendationEngineConfiguration = {
  enabled: boolean;
  analysisRulesEnabled: boolean;
  generationRulesEnabled: boolean;
  rankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  /** Default categories plus optional future category IDs — no redesign required. */
  recommendationCategories: string[];
  minRecommendations: number;
  maxRecommendations: number;
  minConfidenceScore: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-07 hard boundaries — force-locked true. */
  neverExecuteRecommendations: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveRecommendationTraceability: true;
  preserveAuditability: true;
  preserveRecommendationIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_STRATEGIC_RECOMMENDATION_ENGINE_CONFIGURATION: StrategicRecommendationEngineConfiguration =
  {
    enabled: true,
    analysisRulesEnabled: true,
    generationRulesEnabled: true,
    rankingRulesEnabled: true,
    validationRulesEnabled: true,
    recommendationCategories: [...RECOMMENDATION_CATEGORIES],
    minRecommendations: 3,
    maxRecommendations: 12,
    minConfidenceScore: 40,
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteRecommendations: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRecommendationTraceability: true,
    preserveAuditability: true,
    preserveRecommendationIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildStrategicRecommendationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<StrategicRecommendationEngineConfiguration> = {},
): StrategicRecommendationEngineConfiguration {
  let file: Partial<StrategicRecommendationEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "strategic-recommendation-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.STRATEGIC_RECOMMENDATION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.STRATEGIC_RECOMMENDATION_RETRY_ATTEMPTS ?? "", 10);
  const minRecs = Number.parseInt(process.env.STRATEGIC_RECOMMENDATION_MIN ?? "", 10);
  const maxRecs = Number.parseInt(process.env.STRATEGIC_RECOMMENDATION_MAX ?? "", 10);

  const mergedCategories = Array.from(
    new Set([
      ...DEFAULT_STRATEGIC_RECOMMENDATION_ENGINE_CONFIGURATION.recommendationCategories,
      ...(file.recommendationCategories ?? []),
      ...(overrides.recommendationCategories ?? []),
    ]),
  );

  return {
    ...DEFAULT_STRATEGIC_RECOMMENDATION_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    recommendationCategories: mergedCategories,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(minRecs) ? { minRecommendations: minRecs } : {}),
    ...(Number.isFinite(maxRecs) ? { maxRecommendations: maxRecs } : {}),
    neverExecuteRecommendations: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveRecommendationTraceability: true,
    preserveAuditability: true,
    preserveRecommendationIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
