import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type BusinessStateManagerConfiguration = {
  enabled: boolean;
  registryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxBusinesses: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-03 hard boundaries — force-locked true. */
  neverExecuteMissions: true;
  neverAssignWorkers: true;
  neverApproveActions: true;
  neverLaunchBusinesses: true;
  neverMakeStrategicDecisions: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveStateTraceability: true;
  preserveAuditability: true;
  preserveStateIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_BUSINESS_STATE_MANAGER_CONFIGURATION: BusinessStateManagerConfiguration = {
  enabled: true,
  registryRulesEnabled: true,
  validationRulesEnabled: true,
  maxBusinesses: 500,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteMissions: true,
  neverAssignWorkers: true,
  neverApproveActions: true,
  neverLaunchBusinesses: true,
  neverMakeStrategicDecisions: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveStateTraceability: true,
  preserveAuditability: true,
  preserveStateIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildBusinessStateManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessStateManagerConfiguration> = {},
): BusinessStateManagerConfiguration {
  let file: Partial<BusinessStateManagerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "business-state-manager.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.BUSINESS_STATE_MANAGER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.BUSINESS_STATE_MANAGER_RETRY_ATTEMPTS ?? "", 10);
  const maxBiz = Number.parseInt(process.env.BUSINESS_STATE_MANAGER_MAX_BUSINESSES ?? "", 10);
  return {
    ...DEFAULT_BUSINESS_STATE_MANAGER_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxBiz) ? { maxBusinesses: maxBiz } : {}),
    neverExecuteMissions: true,
    neverAssignWorkers: true,
    neverApproveActions: true,
    neverLaunchBusinesses: true,
    neverMakeStrategicDecisions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveStateTraceability: true,
    preserveAuditability: true,
    preserveStateIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
