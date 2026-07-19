/** R3-15 — Externalized Financial Risk Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RiskThresholdRule = {
  category: string;
  warningThreshold: number;
  criticalThreshold: number;
  label: string;
};

export type FinancialRiskMonitorConfiguration = {
  enabled: boolean;
  alertRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  liquidityRiskThreshold: number;
  profitabilityRiskThreshold: number;
  budgetRiskThreshold: number;
  revenueVolatilityThreshold: number;
  expenseVolatilityThreshold: number;
  compositeRiskThreshold: number;
  monitoringFrequencyMs: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  riskThresholds: RiskThresholdRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION: FinancialRiskMonitorConfiguration =
  {
    enabled: true,
    alertRulesEnabled: true,
    validationRulesEnabled: true,
    liquidityRiskThreshold: 60,
    profitabilityRiskThreshold: 60,
    budgetRiskThreshold: 70,
    revenueVolatilityThreshold: 25,
    expenseVolatilityThreshold: 25,
    compositeRiskThreshold: 65,
    monitoringFrequencyMs: 60000,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    riskThresholds: [
      { category: "liquidity", warningThreshold: 40, criticalThreshold: 70, label: "Liquidity risk" },
      { category: "profitability", warningThreshold: 40, criticalThreshold: 70, label: "Profitability risk" },
      { category: "budget", warningThreshold: 50, criticalThreshold: 80, label: "Budget risk" },
      { category: "composite", warningThreshold: 45, criticalThreshold: 75, label: "Composite risk" },
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadFinancialRiskMonitorConfigFile(
  repositoryRoot: string,
): Partial<FinancialRiskMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "financial-risk-monitor.config.json"),
    join(repositoryRoot, "config", "financial-risk-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<FinancialRiskMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFinancialRiskMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialRiskMonitorConfiguration> = {},
): FinancialRiskMonitorConfiguration {
  const fileConfig = repositoryRoot
    ? loadFinancialRiskMonitorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<FinancialRiskMonitorConfiguration> = {
    enabled: envBool(
      "FINANCIAL_RISK_MONITOR_ENABLED",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "FINANCIAL_RISK_MONITOR_TIMEOUT_MS",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "FINANCIAL_RISK_MONITOR_MAX_RETRIES",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.maxRetryAttempts,
    ),
    compositeRiskThreshold: envFloat(
      "FINANCIAL_RISK_MONITOR_COMPOSITE_THRESHOLD",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.compositeRiskThreshold,
    ),
    loggingLevel: envString(
      "FINANCIAL_RISK_MONITOR_LOG_LEVEL",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.loggingLevel,
    ) as FinancialRiskMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FINANCIAL_RISK_MONITOR_AUTO_RECOVER",
      DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FINANCIAL_RISK_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
