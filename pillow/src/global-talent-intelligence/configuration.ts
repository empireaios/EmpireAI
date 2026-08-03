/** X4-13 — Externalized Global Talent Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalTalentIntelligenceConfiguration = {
  enabled: boolean;
  workforceEvaluationRulesEnabled: boolean;
  regionalWorkforceRulesEnabled: boolean;
  capabilityThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true;
  preserveWorkforceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveWorkforceInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION: GlobalTalentIntelligenceConfiguration =
  {
    enabled: true,
    workforceEvaluationRulesEnabled: true,
    regionalWorkforceRulesEnabled: true,
    capabilityThreshold: 55,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true,
    preserveWorkforceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveWorkforceInformation: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadGlobalTalentIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<GlobalTalentIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-talent-intelligence.config.json"),
    join(repositoryRoot, "config", "global-talent-intelligence.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<GlobalTalentIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalTalentIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalTalentIntelligenceConfiguration> = {},
): GlobalTalentIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalTalentIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalTalentIntelligenceConfiguration> = {
    enabled: envBool(
      "GLOBAL_TALENT_INTELLIGENCE_ENABLED",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    capabilityThreshold: envInt(
      "GLOBAL_TALENT_INTELLIGENCE_CAPABILITY_THRESHOLD",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.capabilityThreshold,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_TALENT_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_TALENT_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_TALENT_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as GlobalTalentIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_TALENT_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_TALENT_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence: true,
    preserveWorkforceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveWorkforceInformation: true,
  };
}
