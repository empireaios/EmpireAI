/** R4-13 — Externalized Returns Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type EligibilityRule = {
  ruleId: string;
  label: string;
  maxDaysSinceDelivery: number;
  enabled: boolean;
};

export type RiskScoringRule = {
  ruleId: string;
  label: string;
  baseScore: number;
  repeatReturnMultiplier: number;
  enabled: boolean;
};

export type RecommendationRule = {
  ruleId: string;
  label: string;
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  enabled: boolean;
};

export type ReturnsIntelligenceEngineConfiguration = {
  enabled: boolean;
  eligibilityRulesEnabled: boolean;
  riskScoringRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  abnormalDetectionEnabled: boolean;
  repeatPatternDetectionEnabled: boolean;
  maxReturnsPerCustomerPerMonth: number;
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  eligibilityRules: EligibilityRule[];
  riskScoringRules: RiskScoringRule[];
  recommendationRules: RecommendationRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION: ReturnsIntelligenceEngineConfiguration =
  {
    enabled: true,
    eligibilityRulesEnabled: true,
    riskScoringRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    abnormalDetectionEnabled: true,
    repeatPatternDetectionEnabled: true,
    maxReturnsPerCustomerPerMonth: 5,
    highRiskThreshold: 75,
    mediumRiskThreshold: 45,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    eligibilityRules: [
      {
        ruleId: "default_eligibility",
        label: "Standard return window",
        maxDaysSinceDelivery: 30,
        enabled: true,
      },
    ],
    riskScoringRules: [
      {
        ruleId: "default_risk",
        label: "Standard risk scoring",
        baseScore: 20,
        repeatReturnMultiplier: 15,
        enabled: true,
      },
    ],
    recommendationRules: [
      {
        ruleId: "default_recommendation",
        label: "Risk-based recommendation",
        highRiskThreshold: 75,
        mediumRiskThreshold: 45,
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

export function loadReturnsIntelligenceEngineConfigFile(
  repositoryRoot: string,
): Partial<ReturnsIntelligenceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "returns-intelligence-engine.config.json"),
    join(repositoryRoot, "config", "returns-intelligence-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ReturnsIntelligenceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildReturnsIntelligenceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ReturnsIntelligenceEngineConfiguration> = {},
): ReturnsIntelligenceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadReturnsIntelligenceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ReturnsIntelligenceEngineConfiguration> = {
    enabled: envBool(
      "RETURNS_INTELLIGENCE_ENGINE_ENABLED",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "RETURNS_INTELLIGENCE_ENGINE_TIMEOUT_MS",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "RETURNS_INTELLIGENCE_ENGINE_MAX_RETRIES",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highRiskThreshold: envInt(
      "RETURNS_INTELLIGENCE_ENGINE_HIGH_RISK_THRESHOLD",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.highRiskThreshold,
    ),
    loggingLevel: envString(
      "RETURNS_INTELLIGENCE_ENGINE_LOG_LEVEL",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as ReturnsIntelligenceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "RETURNS_INTELLIGENCE_ENGINE_AUTO_RECOVER",
      DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_RETURNS_INTELLIGENCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
