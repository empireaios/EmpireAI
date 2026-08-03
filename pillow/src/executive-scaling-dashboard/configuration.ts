/** X3-09 — Externalized Executive Scaling Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExecutiveScalingDashboardConfiguration = {
  enabled: boolean;
  dashboardRefreshEnabled: boolean;
  aggregationRulesEnabled: boolean;
  widgetRulesEnabled: boolean;
  alertRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
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
  minScalingReadiness: number;
  minOpportunityScore: number;
  minCapacityScore: number;
  minMarketingScore: number;
  minSupplierScore: number;
  minFinancialScore: number;
  minWorkforceScore: number;
  alertThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION: ExecutiveScalingDashboardConfiguration =
  {
    enabled: true,
    dashboardRefreshEnabled: true,
    aggregationRulesEnabled: true,
    widgetRulesEnabled: true,
    alertRulesEnabled: true,
    recommendationRulesEnabled: true,
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
    minScalingReadiness: 55,
    minOpportunityScore: 55,
    minCapacityScore: 55,
    minMarketingScore: 55,
    minSupplierScore: 55,
    minFinancialScore: 55,
    minWorkforceScore: 55,
    alertThreshold: 45,
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

export function loadExecutiveScalingDashboardConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveScalingDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-scaling-dashboard.config.json"),
    join(repositoryRoot, "config", "executive-scaling-dashboard.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveScalingDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveScalingDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveScalingDashboardConfiguration> = {},
): ExecutiveScalingDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveScalingDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveScalingDashboardConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_SCALING_DASHBOARD_ENABLED",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_MAX_RETRIES",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    minScalingReadiness: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_MIN_SCALING",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.minScalingReadiness,
    ),
    minOpportunityScore: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_MIN_OPPORTUNITY",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.minOpportunityScore,
    ),
    minCapacityScore: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_MIN_CAPACITY",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.minCapacityScore,
    ),
    alertThreshold: envInt(
      "EXECUTIVE_SCALING_DASHBOARD_ALERT_THRESHOLD",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.alertThreshold,
    ),
    loggingLevel: envString(
      "EXECUTIVE_SCALING_DASHBOARD_LOG_LEVEL",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as ExecutiveScalingDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_SCALING_DASHBOARD_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_SCALING_DASHBOARD_CONFIGURATION,
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
  };
}
