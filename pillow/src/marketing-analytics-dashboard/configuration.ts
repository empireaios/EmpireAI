/** R5-10 — Externalized Marketing Analytics Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketingAnalyticsDashboardConfiguration = {
  enabled: boolean;
  dashboardRefreshFrequencyMs: number;
  kpiSelectionRulesEnabled: boolean;
  executiveSummaryRulesEnabled: boolean;
  alertDisplayRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  requireAuthorizedAccess: true;
  maskSensitiveValues: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION: MarketingAnalyticsDashboardConfiguration =
  {
    enabled: true,
    dashboardRefreshFrequencyMs: 60000,
    kpiSelectionRulesEnabled: true,
    executiveSummaryRulesEnabled: true,
    alertDisplayRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    requireAuthorizedAccess: true,
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

export function loadMarketingAnalyticsDashboardConfigFile(
  repositoryRoot: string,
): Partial<MarketingAnalyticsDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketing-analytics-dashboard.config.json"),
    join(repositoryRoot, "config", "marketing-analytics-dashboard.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketingAnalyticsDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketingAnalyticsDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketingAnalyticsDashboardConfiguration> = {},
): MarketingAnalyticsDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketingAnalyticsDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketingAnalyticsDashboardConfiguration> = {
    enabled: envBool(
      "MARKETING_ANALYTICS_DASHBOARD_ENABLED",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.enabled,
    ),
    dashboardRefreshFrequencyMs: envInt(
      "MARKETING_ANALYTICS_DASHBOARD_REFRESH_MS",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.dashboardRefreshFrequencyMs,
    ),
    connectionTimeoutMs: envInt(
      "MARKETING_ANALYTICS_DASHBOARD_TIMEOUT_MS",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETING_ANALYTICS_DASHBOARD_MAX_RETRIES",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETING_ANALYTICS_DASHBOARD_LOG_LEVEL",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as MarketingAnalyticsDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETING_ANALYTICS_DASHBOARD_AUTO_RECOVER",
      DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MARKETING_ANALYTICS_DASHBOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    requireAuthorizedAccess: true,
    maskSensitiveValues: true,
  };
}
