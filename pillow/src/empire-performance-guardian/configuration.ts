import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpirePerformanceGuardianConfiguration = {
  enabled: boolean;
  kpiMonitoringRulesEnabled: boolean;
  healthThreshold: number;
  anomalyDetectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  recommendationThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSuppressCriticalEnterpriseAlerts: true;
  preservePerformanceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EMPIRE_PERFORMANCE_GUARDIAN_CONFIGURATION: EmpirePerformanceGuardianConfiguration = {
  enabled: true,
  kpiMonitoringRulesEnabled: true,
  healthThreshold: 70,
  anomalyDetectionRulesEnabled: true,
  validationRulesEnabled: true,
  recommendationThreshold: 55,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverSuppressCriticalEnterpriseAlerts: true,
  preservePerformanceTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildEmpirePerformanceGuardianConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmpirePerformanceGuardianConfiguration> = {},
): EmpirePerformanceGuardianConfiguration {
  let file: Partial<EmpirePerformanceGuardianConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-performance-guardian.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EMPIRE_PERFORMANCE_GUARDIAN_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EMPIRE_PERFORMANCE_GUARDIAN_RETRY_ATTEMPTS ?? "", 10);
  const health = Number.parseInt(process.env.EMPIRE_PERFORMANCE_GUARDIAN_HEALTH_THRESHOLD ?? "", 10);
  const recommendation = Number.parseInt(process.env.EMPIRE_PERFORMANCE_GUARDIAN_RECOMMENDATION_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_EMPIRE_PERFORMANCE_GUARDIAN_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(health) ? { healthThreshold: health } : {}),
    ...(Number.isFinite(recommendation) ? { recommendationThreshold: recommendation } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverSuppressCriticalEnterpriseAlerts: true,
    preservePerformanceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
