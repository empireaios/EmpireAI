/** R5-11 — Externalized Creative Asset Manager configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CreativeAssetManagerConfiguration = {
  enabled: boolean;
  assetClassificationRulesEnabled: boolean;
  versionManagementRulesEnabled: boolean;
  approvalWorkflowRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverOverwriteApprovedWithoutValidation: true;
  maskSensitiveValues: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION: CreativeAssetManagerConfiguration = {
  enabled: true,
  assetClassificationRulesEnabled: true,
  versionManagementRulesEnabled: true,
  approvalWorkflowRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverOverwriteApprovedWithoutValidation: true,
  maskSensitiveValues: true,
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

export function loadCreativeAssetManagerConfigFile(
  repositoryRoot: string,
): Partial<CreativeAssetManagerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "creative-asset-manager.config.json"),
    join(repositoryRoot, "config", "creative-asset-manager.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CreativeAssetManagerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCreativeAssetManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CreativeAssetManagerConfiguration> = {},
): CreativeAssetManagerConfiguration {
  const fileConfig = repositoryRoot ? loadCreativeAssetManagerConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CreativeAssetManagerConfiguration> = {
    enabled: envBool(
      "CREATIVE_ASSET_MANAGER_ENABLED",
      DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CREATIVE_ASSET_MANAGER_TIMEOUT_MS",
      DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CREATIVE_ASSET_MANAGER_MAX_RETRIES",
      DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CREATIVE_ASSET_MANAGER_LOG_LEVEL",
      DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION.loggingLevel,
    ) as CreativeAssetManagerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CREATIVE_ASSET_MANAGER_AUTO_RECOVER",
      DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CREATIVE_ASSET_MANAGER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverOverwriteApprovedWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
