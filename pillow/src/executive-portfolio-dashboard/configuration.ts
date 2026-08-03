/** X2-06 — Externalized Executive Portfolio Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExecutivePortfolioDashboardConfiguration = {
  enabled: boolean;
  dashboardRefreshFrequencySeconds: number;
  kpiSelectionRulesEnabled: boolean;
  executiveAlertRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverPermitUnauthorizedAccess: true;
  preserveDashboardTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  alertHealthScoreThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION: ExecutivePortfolioDashboardConfiguration =
  {
    enabled: true,
    dashboardRefreshFrequencySeconds: 60,
    kpiSelectionRulesEnabled: true,
    executiveAlertRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverPermitUnauthorizedAccess: true,
    preserveDashboardTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    alertHealthScoreThreshold: 60,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
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

export function loadExecutivePortfolioDashboardConfigFile(
  repositoryRoot: string,
): Partial<ExecutivePortfolioDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-portfolio-dashboard.config.json"),
    join(repositoryRoot, "config", "executive-portfolio-dashboard.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutivePortfolioDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutivePortfolioDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutivePortfolioDashboardConfiguration> = {},
): ExecutivePortfolioDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutivePortfolioDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutivePortfolioDashboardConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_ENABLED",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.enabled,
    ),
    dashboardRefreshFrequencySeconds: envInt(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_REFRESH_SECONDS",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.dashboardRefreshFrequencySeconds,
    ),
    connectionTimeoutMs: envInt(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_MAX_RETRIES",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_LOG_LEVEL",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as ExecutivePortfolioDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_PORTFOLIO_DASHBOARD_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_PORTFOLIO_DASHBOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverPermitUnauthorizedAccess: true,
    preserveDashboardTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
