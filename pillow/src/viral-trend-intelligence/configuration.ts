/** R5-16 — Externalized Viral Trend Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ViralTrendIntelligenceConfiguration = {
  enabled: boolean;
  trendMonitoringRulesEnabled: boolean;
  trendScoringRulesEnabled: boolean;
  predictionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverCollectRestrictedOrUnauthorizedInfo: true;
  authorizedPublicSignalsOnly: true;
  maskSensitiveValues: true;
  accelerationThresholdPercent: number;
  declineThresholdPercent: number;
  emergingScoreThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION: ViralTrendIntelligenceConfiguration = {
  enabled: true,
  trendMonitoringRulesEnabled: true,
  trendScoringRulesEnabled: true,
  predictionRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverCollectRestrictedOrUnauthorizedInfo: true,
  authorizedPublicSignalsOnly: true,
  maskSensitiveValues: true,
  accelerationThresholdPercent: 20,
  declineThresholdPercent: -15,
  emergingScoreThreshold: 55,
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

export function loadViralTrendIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<ViralTrendIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "viral-trend-intelligence.config.json"),
    join(repositoryRoot, "config", "viral-trend-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ViralTrendIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildViralTrendIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ViralTrendIntelligenceConfiguration> = {},
): ViralTrendIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadViralTrendIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ViralTrendIntelligenceConfiguration> = {
    enabled: envBool(
      "VIRAL_TREND_INTELLIGENCE_ENABLED",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "VIRAL_TREND_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "VIRAL_TREND_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "VIRAL_TREND_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as ViralTrendIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VIRAL_TREND_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
    accelerationThresholdPercent: envInt(
      "VIRAL_TREND_INTELLIGENCE_ACCELERATION_THRESHOLD",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.accelerationThresholdPercent,
    ),
    declineThresholdPercent: envInt(
      "VIRAL_TREND_INTELLIGENCE_DECLINE_THRESHOLD",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.declineThresholdPercent,
    ),
    emergingScoreThreshold: envInt(
      "VIRAL_TREND_INTELLIGENCE_EMERGING_THRESHOLD",
      DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION.emergingScoreThreshold,
    ),
  };

  return {
    ...DEFAULT_VIRAL_TREND_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverCollectRestrictedOrUnauthorizedInfo: true,
    authorizedPublicSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
