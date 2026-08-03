import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AUDIT_TYPES } from "./paths.js";

export type ExecutiveAuditEngineConfiguration = {
  enabled: boolean;
  inspectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  reportingRulesEnabled: boolean;
  /** Default audit types plus optional future type IDs — no redesign required. */
  auditTypes: string[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-08 hard boundaries — force-locked true. */
  neverExecuteCorrections: true;
  neverApproveMissions: true;
  neverAssignWorkers: true;
  neverModifyBusinessState: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveAuditTraceability: true;
  preserveAuditability: true;
  preserveAuditIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EXECUTIVE_AUDIT_ENGINE_CONFIGURATION: ExecutiveAuditEngineConfiguration = {
  enabled: true,
  inspectionRulesEnabled: true,
  validationRulesEnabled: true,
  reportingRulesEnabled: true,
  auditTypes: [...AUDIT_TYPES],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteCorrections: true,
  neverApproveMissions: true,
  neverAssignWorkers: true,
  neverModifyBusinessState: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveAuditTraceability: true,
  preserveAuditability: true,
  preserveAuditIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildExecutiveAuditEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveAuditEngineConfiguration> = {},
): ExecutiveAuditEngineConfiguration {
  let file: Partial<ExecutiveAuditEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "executive-audit-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTIVE_AUDIT_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXECUTIVE_AUDIT_RETRY_ATTEMPTS ?? "", 10);

  const mergedTypes = Array.from(
    new Set([
      ...DEFAULT_EXECUTIVE_AUDIT_ENGINE_CONFIGURATION.auditTypes,
      ...(file.auditTypes ?? []),
      ...(overrides.auditTypes ?? []),
    ]),
  );

  return {
    ...DEFAULT_EXECUTIVE_AUDIT_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    auditTypes: mergedTypes,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteCorrections: true,
    neverApproveMissions: true,
    neverAssignWorkers: true,
    neverModifyBusinessState: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveAuditTraceability: true,
    preserveAuditability: true,
    preserveAuditIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
