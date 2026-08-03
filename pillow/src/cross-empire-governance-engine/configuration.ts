import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type CrossEmpireGovernanceEngineConfiguration = {
  enabled: boolean;
  governanceRulesEnabled: boolean;
  constitutionalValidationRulesEnabled: boolean;
  complianceThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverBypassConstitutionalGovernance: true;
  neverApproveNonCompliantOperationsAutomatically: true;
  preserveGovernanceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveGovernanceInformation: true;
};

export const DEFAULT_CROSS_EMPIRE_GOVERNANCE_ENGINE_CONFIGURATION: CrossEmpireGovernanceEngineConfiguration = {
  enabled: true,
  governanceRulesEnabled: true,
  constitutionalValidationRulesEnabled: true,
  complianceThreshold: 70,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverBypassConstitutionalGovernance: true,
  neverApproveNonCompliantOperationsAutomatically: true,
  preserveGovernanceTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveGovernanceInformation: true,
};

export function buildCrossEmpireGovernanceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrossEmpireGovernanceEngineConfiguration> = {},
): CrossEmpireGovernanceEngineConfiguration {
  let file: Partial<CrossEmpireGovernanceEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "cross-empire-governance-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const compliance = Number.parseInt(process.env.CROSS_EMPIRE_GOVERNANCE_COMPLIANCE_THRESHOLD ?? "", 10);
  const timeout = Number.parseInt(process.env.CROSS_EMPIRE_GOVERNANCE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CROSS_EMPIRE_GOVERNANCE_RETRY_ATTEMPTS ?? "", 10);
  return {
    ...DEFAULT_CROSS_EMPIRE_GOVERNANCE_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(compliance) ? { complianceThreshold: compliance } : {}),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverBypassConstitutionalGovernance: true,
    neverApproveNonCompliantOperationsAutomatically: true,
    preserveGovernanceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveGovernanceInformation: true,
  };
}
