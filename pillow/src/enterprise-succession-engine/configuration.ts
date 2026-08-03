import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EnterpriseSuccessionEngineConfiguration = {
  enabled: boolean;
  continuityPlanningRulesEnabled: boolean;
  successionEvaluationRulesEnabled: boolean;
  readinessThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyGovernanceApprovedSuccessionPlansAutomatically: true;
  preserveSuccessionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOrganizationalInformation: true;
};

export const DEFAULT_ENTERPRISE_SUCCESSION_ENGINE_CONFIGURATION: EnterpriseSuccessionEngineConfiguration = {
  enabled: true,
  continuityPlanningRulesEnabled: true,
  successionEvaluationRulesEnabled: true,
  readinessThreshold: 70,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverModifyGovernanceApprovedSuccessionPlansAutomatically: true,
  preserveSuccessionTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveOrganizationalInformation: true,
};

export function buildEnterpriseSuccessionEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EnterpriseSuccessionEngineConfiguration> = {},
): EnterpriseSuccessionEngineConfiguration {
  let file: Partial<EnterpriseSuccessionEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "enterprise-succession-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const readiness = Number.parseInt(process.env.ENTERPRISE_SUCCESSION_READINESS_THRESHOLD ?? "", 10);
  const timeout = Number.parseInt(process.env.ENTERPRISE_SUCCESSION_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.ENTERPRISE_SUCCESSION_RETRY_ATTEMPTS ?? "", 10);
  return {
    ...DEFAULT_ENTERPRISE_SUCCESSION_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(readiness) ? { readinessThreshold: readiness } : {}),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverModifyGovernanceApprovedSuccessionPlansAutomatically: true,
    preserveSuccessionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOrganizationalInformation: true,
  };
}
