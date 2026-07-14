/** T5-02 — Externalized Autonomous UX Audit configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AutonomousUxAuditConfiguration = {
  enabled: boolean;
  continuousAuditEnabled: boolean;
  auditFrequencyMs: number;
  issueDetectionRulesEnabled: boolean;
  severityRulesEnabled: boolean;
  confidenceThreshold: number;
  evidenceRequirementsEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  auditTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryAudits: number;
  auditOnlyMode: boolean;
};

export const DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION: AutonomousUxAuditConfiguration =
  {
    enabled: true,
    continuousAuditEnabled: true,
    auditFrequencyMs: 5000,
    issueDetectionRulesEnabled: true,
    severityRulesEnabled: true,
    confidenceThreshold: 0.5,
    evidenceRequirementsEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    auditTimeoutMs: 45000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryAudits: 150,
    auditOnlyMode: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadAutonomousUxAuditConfigFile(
  repositoryRoot: string,
): Partial<AutonomousUxAuditConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-ux-audit.config.json"),
    join(repositoryRoot, "config", "autonomous-ux-audit.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousUxAuditConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousUxAuditConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousUxAuditConfiguration> = {},
): AutonomousUxAuditConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousUxAuditConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<AutonomousUxAuditConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_UX_AUDIT_ENABLED",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.enabled,
    ),
    continuousAuditEnabled: envBool(
      "AUTONOMOUS_UX_AUDIT_CONTINUOUS",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.continuousAuditEnabled,
    ),
    auditFrequencyMs: envInt(
      "AUTONOMOUS_UX_AUDIT_FREQUENCY_MS",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.auditFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "AUTONOMOUS_UX_AUDIT_CONFIDENCE_THRESHOLD",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_UX_AUDIT_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.maxRetryAttempts,
    ),
    auditTimeoutMs: envInt(
      "AUTONOMOUS_UX_AUDIT_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.auditTimeoutMs,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_UX_AUDIT_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.loggingLevel,
    ) as AutonomousUxAuditConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_UX_AUDIT_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_UX_AUDIT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    auditOnlyMode: true,
  };
}
