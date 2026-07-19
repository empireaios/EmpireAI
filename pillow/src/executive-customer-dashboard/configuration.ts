/** R4-18 — Externalized Executive Customer Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { WIDGET_TYPES } from "./paths.js";

export type KpiSelectionRule = {
  kpiId: string;
  label: string;
  enabled: boolean;
};

export type ExecutiveSummaryRule = {
  ruleId: string;
  label: string;
  enabled: boolean;
};

export type AlertDisplayRule = {
  ruleId: string;
  label: string;
  threshold: number;
  enabled: boolean;
};

export type ExecutiveCustomerDashboardConfiguration = {
  enabled: boolean;
  dashboardRefreshFrequencyMs: number;
  kpiSelectionRulesEnabled: boolean;
  executiveSummaryRulesEnabled: boolean;
  alertDisplayRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultWidgets: (typeof WIDGET_TYPES)[number][];
  kpiRules: KpiSelectionRule[];
  executiveSummaryRules: ExecutiveSummaryRule[];
  alertDisplayRules: AlertDisplayRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION: ExecutiveCustomerDashboardConfiguration =
  {
    enabled: true,
    dashboardRefreshFrequencyMs: 60000,
    kpiSelectionRulesEnabled: true,
    executiveSummaryRulesEnabled: true,
    alertDisplayRulesEnabled: true,
    validationRulesEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    defaultWidgets: [
      "growth",
      "activity",
      "lifetime_value",
      "segmentation",
      "sentiment",
      "loyalty",
      "journey",
      "risk",
      "support",
      "kpi",
    ],
    kpiRules: [
      { kpiId: "total_customers", label: "Total Customers", enabled: true },
      { kpiId: "avg_clv", label: "Average CLV", enabled: true },
      { kpiId: "avg_sentiment", label: "Average Sentiment", enabled: true },
      { kpiId: "high_risk_count", label: "High Risk Customers", enabled: true },
      { kpiId: "support_resolution_rate", label: "Support Resolution Rate", enabled: true },
    ],
    executiveSummaryRules: [
      { ruleId: "growth_trend", label: "Customer growth trend", enabled: true },
      { ruleId: "risk_alert", label: "Risk alert summary", enabled: true },
    ],
    alertDisplayRules: [
      { ruleId: "high_risk", label: "High risk threshold", threshold: 65, enabled: true },
      { ruleId: "low_sentiment", label: "Low sentiment threshold", threshold: 40, enabled: true },
    ],
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

export function loadExecutiveCustomerDashboardConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveCustomerDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-customer-dashboard.config.json"),
    join(repositoryRoot, "config", "executive-customer-dashboard.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveCustomerDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveCustomerDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveCustomerDashboardConfiguration> = {},
): ExecutiveCustomerDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveCustomerDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveCustomerDashboardConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_CUSTOMER_DASHBOARD_ENABLED",
      DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "EXECUTIVE_CUSTOMER_DASHBOARD_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_CUSTOMER_DASHBOARD_MAX_RETRIES",
      DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EXECUTIVE_CUSTOMER_DASHBOARD_LOG_LEVEL",
      DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as ExecutiveCustomerDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_CUSTOMER_DASHBOARD_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_CUSTOMER_DASHBOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
