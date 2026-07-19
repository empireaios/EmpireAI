/** R5-09 — Externalized Attribution Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AttributionEngineConfiguration = {
  enabled: boolean;
  attributionModelRulesEnabled: boolean;
  touchpointRulesEnabled: boolean;
  roiCalculationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverModifyCampaignData: true;
  redactCustomerIdentifiers: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maskSensitiveValues: true;
  defaultAttributionModel: "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";
};

export const DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION: AttributionEngineConfiguration = {
  enabled: true,
  attributionModelRulesEnabled: true,
  touchpointRulesEnabled: true,
  roiCalculationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverModifyCampaignData: true,
  redactCustomerIdentifiers: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  maskSensitiveValues: true,
  defaultAttributionModel: "linear",
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

export function loadAttributionEngineConfigFile(
  repositoryRoot: string,
): Partial<AttributionEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "attribution-engine.config.json"),
    join(repositoryRoot, "config", "attribution-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AttributionEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAttributionEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AttributionEngineConfiguration> = {},
): AttributionEngineConfiguration {
  const fileConfig = repositoryRoot ? loadAttributionEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AttributionEngineConfiguration> = {
    enabled: envBool(
      "ATTRIBUTION_ENGINE_ENABLED",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "ATTRIBUTION_ENGINE_TIMEOUT_MS",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ATTRIBUTION_ENGINE_MAX_RETRIES",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "ATTRIBUTION_ENGINE_LOG_LEVEL",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.loggingLevel,
    ) as AttributionEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ATTRIBUTION_ENGINE_AUTO_RECOVER",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.autoRecover,
    ),
    defaultAttributionModel: envString(
      "ATTRIBUTION_ENGINE_DEFAULT_MODEL",
      DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION.defaultAttributionModel,
    ) as AttributionEngineConfiguration["defaultAttributionModel"],
  };

  return {
    ...DEFAULT_ATTRIBUTION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverModifyCampaignData: true,
    redactCustomerIdentifiers: true,
    maskSensitiveValues: true,
  };
}
