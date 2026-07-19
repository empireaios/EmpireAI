/** R5-08 — Externalized Audience Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AudienceIntelligenceConfiguration = {
  enabled: boolean;
  audienceAnalysisRulesEnabled: boolean;
  audienceScoringRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  redactPiiInRecords: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION: AudienceIntelligenceConfiguration = {
  enabled: true,
  audienceAnalysisRulesEnabled: true,
  audienceScoringRulesEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  redactPiiInRecords: true,
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

export function loadAudienceIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<AudienceIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "audience-intelligence.config.json"),
    join(repositoryRoot, "config", "audience-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AudienceIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAudienceIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AudienceIntelligenceConfiguration> = {},
): AudienceIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadAudienceIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AudienceIntelligenceConfiguration> = {
    enabled: envBool(
      "AUDIENCE_INTELLIGENCE_ENABLED",
      DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AUDIENCE_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AUDIENCE_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AUDIENCE_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as AudienceIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUDIENCE_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AUDIENCE_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    redactPiiInRecords: true,
    maskSensitiveValues: true,
  };
}
