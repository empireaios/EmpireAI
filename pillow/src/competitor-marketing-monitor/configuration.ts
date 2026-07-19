/** R5-15 — Externalized Competitor Marketing Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CompetitorMarketingMonitorConfiguration = {
  enabled: boolean;
  monitoringFrequencyMinutes: number;
  competitorDiscoveryRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverCollectRestrictedOrUnauthorizedInfo: true;
  authorizedPublicSignalsOnly: true;
  maskSensitiveValues: true;
  competitiveAlertThreshold: number;
  emergingCompetitorScoreThreshold: number;
  strategyChangeDeltaThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION: CompetitorMarketingMonitorConfiguration =
  {
    enabled: true,
    monitoringFrequencyMinutes: 60,
    competitorDiscoveryRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverCollectRestrictedOrUnauthorizedInfo: true,
    authorizedPublicSignalsOnly: true,
    maskSensitiveValues: true,
    competitiveAlertThreshold: 70,
    emergingCompetitorScoreThreshold: 55,
    strategyChangeDeltaThreshold: 15,
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

export function loadCompetitorMarketingMonitorConfigFile(
  repositoryRoot: string,
): Partial<CompetitorMarketingMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "competitor-marketing-monitor.config.json"),
    join(repositoryRoot, "config", "competitor-marketing-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CompetitorMarketingMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCompetitorMarketingMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CompetitorMarketingMonitorConfiguration> = {},
): CompetitorMarketingMonitorConfiguration {
  const fileConfig = repositoryRoot
    ? loadCompetitorMarketingMonitorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CompetitorMarketingMonitorConfiguration> = {
    enabled: envBool(
      "COMPETITOR_MARKETING_MONITOR_ENABLED",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.enabled,
    ),
    monitoringFrequencyMinutes: envInt(
      "COMPETITOR_MARKETING_MONITOR_FREQUENCY_MINUTES",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.monitoringFrequencyMinutes,
    ),
    connectionTimeoutMs: envInt(
      "COMPETITOR_MARKETING_MONITOR_TIMEOUT_MS",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "COMPETITOR_MARKETING_MONITOR_MAX_RETRIES",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "COMPETITOR_MARKETING_MONITOR_LOG_LEVEL",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.loggingLevel,
    ) as CompetitorMarketingMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPETITOR_MARKETING_MONITOR_AUTO_RECOVER",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.autoRecover,
    ),
    competitiveAlertThreshold: envInt(
      "COMPETITOR_MARKETING_MONITOR_ALERT_THRESHOLD",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.competitiveAlertThreshold,
    ),
    emergingCompetitorScoreThreshold: envInt(
      "COMPETITOR_MARKETING_MONITOR_EMERGING_THRESHOLD",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.emergingCompetitorScoreThreshold,
    ),
    strategyChangeDeltaThreshold: envInt(
      "COMPETITOR_MARKETING_MONITOR_STRATEGY_DELTA",
      DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION.strategyChangeDeltaThreshold,
    ),
  };

  return {
    ...DEFAULT_COMPETITOR_MARKETING_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverCollectRestrictedOrUnauthorizedInfo: true,
    authorizedPublicSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
