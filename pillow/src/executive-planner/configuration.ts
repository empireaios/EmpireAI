import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ExecutivePlannerConfiguration = {
  enabled: boolean;
  planningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxStages: number;
  maxWorkforceCategories: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-01 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverAssignWorkers: true;
  neverInvokeTools: true;
  neverApproveActions: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preservePlanTraceability: true;
  preserveAuditability: true;
  preservePlanningIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EXECUTIVE_PLANNER_CONFIGURATION: ExecutivePlannerConfiguration = {
  enabled: true,
  planningRulesEnabled: true,
  validationRulesEnabled: true,
  maxStages: 8,
  maxWorkforceCategories: 10,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverAssignWorkers: true,
  neverInvokeTools: true,
  neverApproveActions: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preservePlanTraceability: true,
  preserveAuditability: true,
  preservePlanningIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildExecutivePlannerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutivePlannerConfiguration> = {},
): ExecutivePlannerConfiguration {
  let file: Partial<ExecutivePlannerConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "executive-planner.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTIVE_PLANNER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXECUTIVE_PLANNER_RETRY_ATTEMPTS ?? "", 10);
  const maxStages = Number.parseInt(process.env.EXECUTIVE_PLANNER_MAX_STAGES ?? "", 10);
  return {
    ...DEFAULT_EXECUTIVE_PLANNER_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxStages) ? { maxStages } : {}),
    neverExecuteWork: true,
    neverAssignWorkers: true,
    neverInvokeTools: true,
    neverApproveActions: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preservePlanTraceability: true,
    preserveAuditability: true,
    preservePlanningIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
