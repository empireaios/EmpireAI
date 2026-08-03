import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireLegacyEngineConfiguration = {
  enabled: boolean;
  historicalRetentionRulesEnabled: boolean;
  archivePoliciesEnabled: boolean;
  validationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  significanceRecommendationThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyValidatedHistoricalRecordsWithoutAuthorization: true;
  preserveHistoricalTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EMPIRE_LEGACY_ENGINE_CONFIGURATION: EmpireLegacyEngineConfiguration = {
  enabled: true,
  historicalRetentionRulesEnabled: true,
  archivePoliciesEnabled: true,
  validationRulesEnabled: true,
  recommendationRulesEnabled: true,
  significanceRecommendationThreshold: 2,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverModifyValidatedHistoricalRecordsWithoutAuthorization: true,
  preserveHistoricalTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildEmpireLegacyEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmpireLegacyEngineConfiguration> = {},
): EmpireLegacyEngineConfiguration {
  let file: Partial<EmpireLegacyEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-legacy-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EMPIRE_LEGACY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EMPIRE_LEGACY_RETRY_ATTEMPTS ?? "", 10);
  const threshold = Number.parseInt(process.env.EMPIRE_LEGACY_SIGNIFICANCE_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_EMPIRE_LEGACY_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(threshold) ? { significanceRecommendationThreshold: threshold } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverModifyValidatedHistoricalRecordsWithoutAuthorization: true,
    preserveHistoricalTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
