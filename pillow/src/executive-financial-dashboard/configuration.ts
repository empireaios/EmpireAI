/** R3-16 — Externalized Executive Financial Dashboard configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { WIDGET_TYPES } from "./paths.js";

export type KpiSelectionRule = {
  kpiId: string;
  label: string;
  enabled: boolean;
};

export type ExecutiveFinancialDashboardConfiguration = {
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
  maskSensitiveValues: true;
};

export const DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION: ExecutiveFinancialDashboardConfiguration =
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
    defaultWidgets: ["revenue", "expense", "profit", "cash_flow", "budget", "forecast", "risk", "kpi", "trend"],
    kpiRules: [
      { kpiId: "net_profit", label: "Net Profit", enabled: true },
      { kpiId: "profit_margin", label: "Profit Margin", enabled: true },
      { kpiId: "cash_flow", label: "Net Cash Flow", enabled: true },
      { kpiId: "budget_utilization", label: "Budget Utilization", enabled: true },
      { kpiId: "risk_score", label: "Risk Score", enabled: true },
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

export function loadExecutiveFinancialDashboardConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveFinancialDashboardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-financial-dashboard.config.json"),
    join(repositoryRoot, "config", "executive-financial-dashboard.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveFinancialDashboardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveFinancialDashboardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveFinancialDashboardConfiguration> = {},
): ExecutiveFinancialDashboardConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveFinancialDashboardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveFinancialDashboardConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_FINANCIAL_DASHBOARD_ENABLED",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "EXECUTIVE_FINANCIAL_DASHBOARD_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_FINANCIAL_DASHBOARD_MAX_RETRIES",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.maxRetryAttempts,
    ),
    dashboardRefreshFrequencyMs: envInt(
      "EXECUTIVE_FINANCIAL_DASHBOARD_REFRESH_MS",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.dashboardRefreshFrequencyMs,
    ),
    loggingLevel: envString(
      "EXECUTIVE_FINANCIAL_DASHBOARD_LOG_LEVEL",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.loggingLevel,
    ) as ExecutiveFinancialDashboardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_FINANCIAL_DASHBOARD_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_FINANCIAL_DASHBOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
