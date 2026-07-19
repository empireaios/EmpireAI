/** R4-17 — Externalized Customer Journey Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type JourneyMappingRule = {
  ruleId: string;
  label: string;
  stage: string;
  minTouchpoints: number;
  enabled: boolean;
};

export type OptimizationRule = {
  ruleId: string;
  label: string;
  frictionThreshold: number;
  action: string;
  enabled: boolean;
};

export type PredictionRule = {
  ruleId: string;
  label: string;
  progressionBoost: number;
  enabled: boolean;
};

export type CustomerJourneyIntelligenceConfiguration = {
  enabled: boolean;
  journeyMappingRulesEnabled: boolean;
  optimizationRulesEnabled: boolean;
  predictionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  dropOffInactivityDays: number;
  frictionSentimentThreshold: number;
  conversionPurchaseThreshold: number;
  minJourneyScore: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  journeyMappingRules: JourneyMappingRule[];
  optimizationRules: OptimizationRule[];
  predictionRules: PredictionRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION: CustomerJourneyIntelligenceConfiguration =
  {
    enabled: true,
    journeyMappingRulesEnabled: true,
    optimizationRulesEnabled: true,
    predictionRulesEnabled: true,
    validationRulesEnabled: true,
    dropOffInactivityDays: 30,
    frictionSentimentThreshold: 40,
    conversionPurchaseThreshold: 1,
    minJourneyScore: 0,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    journeyMappingRules: [
      { ruleId: "awareness", label: "Awareness stage", stage: "awareness", minTouchpoints: 1, enabled: true },
      { ruleId: "consideration", label: "Consideration stage", stage: "consideration", minTouchpoints: 2, enabled: true },
      { ruleId: "purchase", label: "Purchase stage", stage: "purchase", minTouchpoints: 1, enabled: true },
      { ruleId: "retention", label: "Retention stage", stage: "retention", minTouchpoints: 3, enabled: true },
    ],
    optimizationRules: [
      { ruleId: "friction_support", label: "Friction escalation", frictionThreshold: 2, action: "escalate_support", enabled: true },
      { ruleId: "dropoff_reengage", label: "Drop-off re-engagement", frictionThreshold: 1, action: "re_engage", enabled: true },
    ],
    predictionRules: [
      { ruleId: "standard_progression", label: "Standard progression", progressionBoost: 10, enabled: true },
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

export function loadCustomerJourneyIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<CustomerJourneyIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-journey-intelligence.config.json"),
    join(repositoryRoot, "config", "customer-journey-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CustomerJourneyIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerJourneyIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerJourneyIntelligenceConfiguration> = {},
): CustomerJourneyIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadCustomerJourneyIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CustomerJourneyIntelligenceConfiguration> = {
    enabled: envBool(
      "CUSTOMER_JOURNEY_INTELLIGENCE_ENABLED",
      DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_JOURNEY_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_JOURNEY_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CUSTOMER_JOURNEY_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as CustomerJourneyIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_JOURNEY_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_JOURNEY_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
