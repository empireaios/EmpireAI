/** R5-07 — Externalized Campaign Manager configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CampaignManagerConfiguration = {
  enabled: boolean;
  campaignLifecycleRulesEnabled: boolean;
  campaignSchedulingRulesEnabled: boolean;
  channelCoordinationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  requireApprovalBeforeLaunch: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION: CampaignManagerConfiguration = {
  enabled: true,
  campaignLifecycleRulesEnabled: true,
  campaignSchedulingRulesEnabled: true,
  channelCoordinationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  requireApprovalBeforeLaunch: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  maskSensitiveValues: true,
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

export function loadCampaignManagerConfigFile(
  repositoryRoot: string,
): Partial<CampaignManagerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "campaign-manager.config.json"),
    join(repositoryRoot, "config", "campaign-manager.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CampaignManagerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCampaignManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CampaignManagerConfiguration> = {},
): CampaignManagerConfiguration {
  const fileConfig = repositoryRoot ? loadCampaignManagerConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CampaignManagerConfiguration> = {
    enabled: envBool(
      "CAMPAIGN_MANAGER_ENABLED",
      DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CAMPAIGN_MANAGER_TIMEOUT_MS",
      DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CAMPAIGN_MANAGER_MAX_RETRIES",
      DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CAMPAIGN_MANAGER_LOG_LEVEL",
      DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION.loggingLevel,
    ) as CampaignManagerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CAMPAIGN_MANAGER_AUTO_RECOVER",
      DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CAMPAIGN_MANAGER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    requireApprovalBeforeLaunch: true,
    maskSensitiveValues: true,
  };
}
