/** R4-15 — Externalized Customer Lifetime Value Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ClvCalculationRule = {
  ruleId: string;
  label: string;
  weight: number;
  enabled: boolean;
};

export type PredictionRule = {
  ruleId: string;
  label: string;
  horizonMonths: number;
  multiplier: number;
  enabled: boolean;
};

export type RetentionRule = {
  ruleId: string;
  label: string;
  minActivityEvents: number;
  scoreBoost: number;
  enabled: boolean;
};

export type CustomerLifetimeValueEngineConfiguration = {
  enabled: boolean;
  clvCalculationRulesEnabled: boolean;
  predictionRulesEnabled: boolean;
  retentionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  highValueThreshold: number;
  decliningValueDropPercent: number;
  defaultProfitMargin: number;
  predictionHorizonMonths: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  clvCalculationRules: ClvCalculationRule[];
  predictionRules: PredictionRule[];
  retentionRules: RetentionRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION: CustomerLifetimeValueEngineConfiguration =
  {
    enabled: true,
    clvCalculationRulesEnabled: true,
    predictionRulesEnabled: true,
    retentionRulesEnabled: true,
    validationRulesEnabled: true,
    highValueThreshold: 500,
    decliningValueDropPercent: 20,
    defaultProfitMargin: 0.25,
    predictionHorizonMonths: 12,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    clvCalculationRules: [
      { ruleId: "revenue_weight", label: "Revenue contribution weight", weight: 1, enabled: true },
      { ruleId: "profit_weight", label: "Profit contribution weight", weight: 1, enabled: true },
      { ruleId: "retention_weight", label: "Retention score weight", weight: 0.5, enabled: true },
    ],
    predictionRules: [
      {
        ruleId: "standard_prediction",
        label: "Standard CLV prediction",
        horizonMonths: 12,
        multiplier: 1.2,
        enabled: true,
      },
    ],
    retentionRules: [
      {
        ruleId: "activity_retention",
        label: "Timeline activity retention boost",
        minActivityEvents: 2,
        scoreBoost: 15,
        enabled: true,
      },
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

export function loadCustomerLifetimeValueEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerLifetimeValueEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-lifetime-value-engine.config.json"),
    join(repositoryRoot, "config", "customer-lifetime-value-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CustomerLifetimeValueEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerLifetimeValueEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerLifetimeValueEngineConfiguration> = {},
): CustomerLifetimeValueEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCustomerLifetimeValueEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CustomerLifetimeValueEngineConfiguration> = {
    enabled: envBool(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_ENABLED",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highValueThreshold: envInt(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_HIGH_VALUE_THRESHOLD",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.highValueThreshold,
    ),
    loggingLevel: envString(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerLifetimeValueEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_LIFETIME_VALUE_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_LIFETIME_VALUE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
