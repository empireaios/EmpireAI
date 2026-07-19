/** R5-12 — Externalized AI Campaign Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AiCampaignGeneratorConfiguration = {
  enabled: boolean;
  campaignGenerationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverPublishWithoutValidation: true;
  maskSensitiveValues: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultBudgetUsd: number;
  defaultCampaignDays: number;
};

export const DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION: AiCampaignGeneratorConfiguration = {
  enabled: true,
  campaignGenerationRulesEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverPublishWithoutValidation: true,
  maskSensitiveValues: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultBudgetUsd: 2500,
  defaultCampaignDays: 14,
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

export function loadAiCampaignGeneratorConfigFile(
  repositoryRoot: string,
): Partial<AiCampaignGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ai-campaign-generator.config.json"),
    join(repositoryRoot, "config", "ai-campaign-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AiCampaignGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAiCampaignGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AiCampaignGeneratorConfiguration> = {},
): AiCampaignGeneratorConfiguration {
  const fileConfig = repositoryRoot ? loadAiCampaignGeneratorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AiCampaignGeneratorConfiguration> = {
    enabled: envBool(
      "AI_CAMPAIGN_GENERATOR_ENABLED",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AI_CAMPAIGN_GENERATOR_TIMEOUT_MS",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AI_CAMPAIGN_GENERATOR_MAX_RETRIES",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AI_CAMPAIGN_GENERATOR_LOG_LEVEL",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.loggingLevel,
    ) as AiCampaignGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AI_CAMPAIGN_GENERATOR_AUTO_RECOVER",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.autoRecover,
    ),
    defaultBudgetUsd: envInt(
      "AI_CAMPAIGN_GENERATOR_DEFAULT_BUDGET",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.defaultBudgetUsd,
    ),
    defaultCampaignDays: envInt(
      "AI_CAMPAIGN_GENERATOR_DEFAULT_DAYS",
      DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION.defaultCampaignDays,
    ),
  };

  return {
    ...DEFAULT_AI_CAMPAIGN_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverPublishWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
