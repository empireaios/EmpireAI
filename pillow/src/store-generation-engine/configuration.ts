/** X1-07 — Externalized Store Generation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type StoreGenerationEngineConfiguration = {
  enabled: boolean;
  websiteGenerationRulesEnabled: boolean;
  navigationRulesEnabled: boolean;
  deploymentPreparationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAutoDeploy: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxStorefrontsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION: StoreGenerationEngineConfiguration = {
  enabled: true,
  websiteGenerationRulesEnabled: true,
  navigationRulesEnabled: true,
  deploymentPreparationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverAutoDeploy: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  maxStorefrontsPerCycle: 12,
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

export function loadStoreGenerationEngineConfigFile(
  repositoryRoot: string,
): Partial<StoreGenerationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "store-generation-engine.config.json"),
    join(repositoryRoot, "config", "store-generation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<StoreGenerationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildStoreGenerationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<StoreGenerationEngineConfiguration> = {},
): StoreGenerationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadStoreGenerationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<StoreGenerationEngineConfiguration> = {
    enabled: envBool(
      "STORE_GENERATION_ENGINE_ENABLED",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "STORE_GENERATION_ENGINE_TIMEOUT_MS",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "STORE_GENERATION_ENGINE_MAX_RETRIES",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "STORE_GENERATION_ENGINE_LOG_LEVEL",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as StoreGenerationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "STORE_GENERATION_ENGINE_AUTO_RECOVER",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.autoRecover,
    ),
    maxStorefrontsPerCycle: envInt(
      "STORE_GENERATION_ENGINE_MAX_STOREFRONTS",
      DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION.maxStorefrontsPerCycle,
    ),
  };

  return {
    ...DEFAULT_STORE_GENERATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAutoDeploy: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
