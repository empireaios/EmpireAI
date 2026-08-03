/** X4-01 — Externalized Global Expansion Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalExpansionFrameworkConfiguration = {
  enabled: boolean;
  moduleRegistrationRulesEnabled: boolean;
  expansionLifecycleRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  eventRoutingRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverBypassValidation: true;
  preserveModuleIsolation: true;
  preserveAuditability: true;
  preserveRecoveryCapability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  maxRegisteredModules: number;
  defaultEventsPerMinute: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION: GlobalExpansionFrameworkConfiguration =
  {
    enabled: true,
    moduleRegistrationRulesEnabled: true,
    expansionLifecycleRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    eventRoutingRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverBypassValidation: true,
    preserveModuleIsolation: true,
    preserveAuditability: true,
    preserveRecoveryCapability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    maxRegisteredModules: 50,
    defaultEventsPerMinute: 60,
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

export function loadGlobalExpansionFrameworkConfigFile(
  repositoryRoot: string,
): Partial<GlobalExpansionFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-expansion-framework.config.json"),
    join(repositoryRoot, "config", "global-expansion-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<GlobalExpansionFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalExpansionFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalExpansionFrameworkConfiguration> = {},
): GlobalExpansionFrameworkConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalExpansionFrameworkConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalExpansionFrameworkConfiguration> = {
    enabled: envBool(
      "GLOBAL_EXPANSION_FRAMEWORK_ENABLED",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_EXPANSION_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_EXPANSION_FRAMEWORK_MAX_RETRIES",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_EXPANSION_FRAMEWORK_LOG_LEVEL",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as GlobalExpansionFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_EXPANSION_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
    maxRegisteredModules: envInt(
      "GLOBAL_EXPANSION_FRAMEWORK_MAX_MODULES",
      DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION.maxRegisteredModules,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_EXPANSION_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverBypassValidation: true,
    preserveModuleIsolation: true,
    preserveAuditability: true,
    preserveRecoveryCapability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
