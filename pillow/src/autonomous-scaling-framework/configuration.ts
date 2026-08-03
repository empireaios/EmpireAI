/** X3-01 — Externalized Autonomous Scaling Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AutonomousScalingFrameworkConfiguration = {
  enabled: boolean;
  moduleRegistrationRulesEnabled: boolean;
  scalingLifecycleRulesEnabled: boolean;
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

export const DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION: AutonomousScalingFrameworkConfiguration =
  {
    enabled: true,
    moduleRegistrationRulesEnabled: true,
    scalingLifecycleRulesEnabled: true,
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

export function loadAutonomousScalingFrameworkConfigFile(
  repositoryRoot: string,
): Partial<AutonomousScalingFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-scaling-framework.config.json"),
    join(repositoryRoot, "config", "autonomous-scaling-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousScalingFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousScalingFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousScalingFrameworkConfiguration> = {},
): AutonomousScalingFrameworkConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousScalingFrameworkConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AutonomousScalingFrameworkConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_SCALING_FRAMEWORK_ENABLED",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AUTONOMOUS_SCALING_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_SCALING_FRAMEWORK_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_SCALING_FRAMEWORK_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as AutonomousScalingFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_SCALING_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
    maxRegisteredModules: envInt(
      "AUTONOMOUS_SCALING_FRAMEWORK_MAX_MODULES",
      DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION.maxRegisteredModules,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_SCALING_FRAMEWORK_CONFIGURATION,
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
