/** R4-14 — Externalized Customer Risk Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FraudDetectionRule = {
  ruleId: string;
  label: string;
  indicatorWeight: number;
  enabled: boolean;
};

export type RiskThresholdRule = {
  ruleId: string;
  label: string;
  mediumThreshold: number;
  highThreshold: number;
  criticalThreshold: number;
  enabled: boolean;
};

export type AlertRule = {
  ruleId: string;
  label: string;
  minScoreForAlert: number;
  enabled: boolean;
};

export type CustomerRiskEngineConfiguration = {
  enabled: boolean;
  fraudDetectionRulesEnabled: boolean;
  riskThresholdRulesEnabled: boolean;
  alertRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  mediumRiskThreshold: number;
  highRiskThreshold: number;
  criticalRiskThreshold: number;
  maxReturnsForAbuseFlag: number;
  maxTicketsForAbuseFlag: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  fraudDetectionRules: FraudDetectionRule[];
  riskThresholdRules: RiskThresholdRule[];
  alertRules: AlertRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION: CustomerRiskEngineConfiguration = {
  enabled: true,
  fraudDetectionRulesEnabled: true,
  riskThresholdRulesEnabled: true,
  alertRulesEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  mediumRiskThreshold: 40,
  highRiskThreshold: 65,
  criticalRiskThreshold: 85,
  maxReturnsForAbuseFlag: 3,
  maxTicketsForAbuseFlag: 5,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  fraudDetectionRules: [
    { ruleId: "repeat_returns", label: "Repeat return pattern", indicatorWeight: 20, enabled: true },
    { ruleId: "negative_sentiment", label: "Negative sentiment cluster", indicatorWeight: 15, enabled: true },
    { ruleId: "open_tickets", label: "Multiple open tickets", indicatorWeight: 10, enabled: true },
  ],
  riskThresholdRules: [
    {
      ruleId: "default_thresholds",
      label: "Standard risk thresholds",
      mediumThreshold: 40,
      highThreshold: 65,
      criticalThreshold: 85,
      enabled: true,
    },
  ],
  alertRules: [
    { ruleId: "default_alert", label: "Score-based alert", minScoreForAlert: 50, enabled: true },
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

export function loadCustomerRiskEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerRiskEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-risk-engine.config.json"),
    join(repositoryRoot, "config", "customer-risk-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CustomerRiskEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerRiskEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerRiskEngineConfiguration> = {},
): CustomerRiskEngineConfiguration {
  const fileConfig = repositoryRoot ? loadCustomerRiskEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CustomerRiskEngineConfiguration> = {
    enabled: envBool(
      "CUSTOMER_RISK_ENGINE_ENABLED",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_RISK_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_RISK_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highRiskThreshold: envInt(
      "CUSTOMER_RISK_ENGINE_HIGH_RISK_THRESHOLD",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.highRiskThreshold,
    ),
    loggingLevel: envString(
      "CUSTOMER_RISK_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerRiskEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_RISK_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_RISK_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
