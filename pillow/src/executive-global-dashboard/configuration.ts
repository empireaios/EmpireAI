/** X4-10 — Externalized Executive Global Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExecutiveGlobalDashboardConfiguration = {
  enabled: boolean;
  dashboardRefreshFrequencyMs: number;
  executiveAlertRulesEnabled: boolean;
  dashboardWidgetConfigurationEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExposeRestrictedEnterpriseInformation: true;
  preserveDashboardTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  requireAuthorizedAccess: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION: ExecutiveGlobalDashboardConfiguration =
  {
    enabled: true,
    dashboardRefreshFrequencyMs: 60000,
    executiveAlertRulesEnabled: true,
    dashboardWidgetConfigurationEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExposeRestrictedEnterpriseInformation: true,
    preserveDashboardTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    requireAuthorizedAccess: true,
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

export function loadExecutiveGlobalDashboardConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveGlobalDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-global-dashboard.config.json"),
    join(repositoryRoot, "config", "executive-global-dashboard.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<ExecutiveGlobalDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveGlobalDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveGlobalDashboardConfiguration> = {},
): ExecutiveGlobalDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveGlobalDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveGlobalDashboardConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_GLOBAL_DASHBOARD_ENABLED",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.enabled,
    ),
    dashboardRefreshFrequencyMs: envInt(
      "EXECUTIVE_GLOBAL_DASHBOARD_REFRESH_MS",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.dashboardRefreshFrequencyMs,
    ),
    connectionTimeoutMs: envInt(
      "EXECUTIVE_GLOBAL_DASHBOARD_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_GLOBAL_DASHBOARD_MAX_RETRIES",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EXECUTIVE_GLOBAL_DASHBOARD_LOG_LEVEL",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as ExecutiveGlobalDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_GLOBAL_DASHBOARD_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_GLOBAL_DASHBOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExposeRestrictedEnterpriseInformation: true,
    preserveDashboardTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    requireAuthorizedAccess: true,
  };
}
