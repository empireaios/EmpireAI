/** X1-11 — Externalized Business Launch Orchestrator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BusinessLaunchOrchestratorConfiguration = {
  enabled: boolean;
  launchWorkflowRulesEnabled: boolean;
  dependencyRulesEnabled: boolean;
  recoveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverLaunchWithoutReadinessValidation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxLaunchesPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION: BusinessLaunchOrchestratorConfiguration =
  {
    enabled: true,
    launchWorkflowRulesEnabled: true,
    dependencyRulesEnabled: true,
    recoveryRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverLaunchWithoutReadinessValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxLaunchesPerCycle: 12,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
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

export function loadBusinessLaunchOrchestratorConfigFile(
  repositoryRoot: string,
): Partial<BusinessLaunchOrchestratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "business-launch-orchestrator.config.json"),
    join(repositoryRoot, "config", "business-launch-orchestrator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BusinessLaunchOrchestratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBusinessLaunchOrchestratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessLaunchOrchestratorConfiguration> = {},
): BusinessLaunchOrchestratorConfiguration {
  const fileConfig = repositoryRoot
    ? loadBusinessLaunchOrchestratorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BusinessLaunchOrchestratorConfiguration> = {
    enabled: envBool(
      "BUSINESS_LAUNCH_ORCHESTRATOR_ENABLED",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUSINESS_LAUNCH_ORCHESTRATOR_TIMEOUT_MS",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUSINESS_LAUNCH_ORCHESTRATOR_MAX_RETRIES",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BUSINESS_LAUNCH_ORCHESTRATOR_LOG_LEVEL",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.loggingLevel,
    ) as BusinessLaunchOrchestratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUSINESS_LAUNCH_ORCHESTRATOR_AUTO_RECOVER",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.autoRecover,
    ),
    maxLaunchesPerCycle: envInt(
      "BUSINESS_LAUNCH_ORCHESTRATOR_MAX_LAUNCHES",
      DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION.maxLaunchesPerCycle,
    ),
  };

  return {
    ...DEFAULT_BUSINESS_LAUNCH_ORCHESTRATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverLaunchWithoutReadinessValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
