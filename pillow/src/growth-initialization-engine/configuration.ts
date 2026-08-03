/** X1-12 — Externalized Growth Initialization Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GrowthInitializationEngineConfiguration = {
  enabled: boolean;
  growthPlanningRulesEnabled: boolean;
  revenueMilestoneRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverModifyOperationalConfigWithoutValidation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxPlansPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION: GrowthInitializationEngineConfiguration =
  {
    enabled: true,
    growthPlanningRulesEnabled: true,
    revenueMilestoneRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverModifyOperationalConfigWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxPlansPerCycle: 12,
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

export function loadGrowthInitializationEngineConfigFile(
  repositoryRoot: string,
): Partial<GrowthInitializationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "growth-initialization-engine.config.json"),
    join(repositoryRoot, "config", "growth-initialization-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<GrowthInitializationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGrowthInitializationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GrowthInitializationEngineConfiguration> = {},
): GrowthInitializationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadGrowthInitializationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GrowthInitializationEngineConfiguration> = {
    enabled: envBool(
      "GROWTH_INITIALIZATION_ENGINE_ENABLED",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "GROWTH_INITIALIZATION_ENGINE_TIMEOUT_MS",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GROWTH_INITIALIZATION_ENGINE_MAX_RETRIES",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GROWTH_INITIALIZATION_ENGINE_LOG_LEVEL",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as GrowthInitializationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GROWTH_INITIALIZATION_ENGINE_AUTO_RECOVER",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.autoRecover,
    ),
    maxPlansPerCycle: envInt(
      "GROWTH_INITIALIZATION_ENGINE_MAX_PLANS",
      DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION.maxPlansPerCycle,
    ),
  };

  return {
    ...DEFAULT_GROWTH_INITIALIZATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverModifyOperationalConfigWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
