/** R4-10 — Externalized Customer Sentiment Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SENTIMENT_CATEGORIES } from "./paths.js";

export type AnalysisRule = {
  ruleId: string;
  label: string;
  category: (typeof SENTIMENT_CATEGORIES)[number];
  keywords: string[];
  scoreDelta: number;
  enabled: boolean;
};

export type AlertThresholdRule = {
  ruleId: string;
  label: string;
  category: (typeof SENTIMENT_CATEGORIES)[number];
  minScore: number;
  maxScore: number;
  severity: "low" | "medium" | "high";
  enabled: boolean;
};

export type TrendRule = {
  ruleId: string;
  label: string;
  minRecords: number;
  improvingDelta: number;
  decliningDelta: number;
  enabled: boolean;
};

export type CustomerSentimentEngineConfiguration = {
  enabled: boolean;
  analysisRulesEnabled: boolean;
  alertThresholdsEnabled: boolean;
  trendRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  frustrationThreshold: number;
  escalationThreshold: number;
  satisfactionThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  analysisRules: AnalysisRule[];
  alertThresholds: AlertThresholdRule[];
  trendRules: TrendRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION: CustomerSentimentEngineConfiguration =
  {
    enabled: true,
    analysisRulesEnabled: true,
    alertThresholdsEnabled: true,
    trendRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    frustrationThreshold: 35,
    escalationThreshold: 25,
    satisfactionThreshold: 75,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    analysisRules: [
      {
        ruleId: "frustrated",
        label: "Frustration signals",
        category: "frustrated",
        keywords: ["frustrated", "angry", "upset", "terrible", "awful", "unacceptable"],
        scoreDelta: -30,
        enabled: true,
      },
      {
        ruleId: "escalation",
        label: "Escalation risk",
        category: "escalation_risk",
        keywords: ["manager", "lawyer", "complaint", "escalate", "urgent", "cancel"],
        scoreDelta: -25,
        enabled: true,
      },
      {
        ruleId: "positive",
        label: "Positive experience",
        category: "positive",
        keywords: ["thank", "great", "excellent", "happy", "love", "appreciate"],
        scoreDelta: 25,
        enabled: true,
      },
      {
        ruleId: "satisfied",
        label: "Satisfaction signals",
        category: "satisfied",
        keywords: ["satisfied", "resolved", "perfect", "helpful", "works well"],
        scoreDelta: 20,
        enabled: true,
      },
      {
        ruleId: "negative",
        label: "Negative sentiment",
        category: "negative",
        keywords: ["bad", "poor", "disappointed", "problem", "issue", "broken"],
        scoreDelta: -15,
        enabled: true,
      },
    ],
    alertThresholds: [
      {
        ruleId: "frustration_alert",
        label: "Frustration alert",
        category: "frustrated",
        minScore: 0,
        maxScore: 35,
        severity: "high",
        enabled: true,
      },
      {
        ruleId: "escalation_alert",
        label: "Escalation risk alert",
        category: "escalation_risk",
        minScore: 0,
        maxScore: 25,
        severity: "high",
        enabled: true,
      },
      {
        ruleId: "positive_alert",
        label: "Positive experience alert",
        category: "positive",
        minScore: 75,
        maxScore: 100,
        severity: "low",
        enabled: true,
      },
    ],
    trendRules: [
      {
        ruleId: "default_trend",
        label: "Default trend analysis",
        minRecords: 2,
        improvingDelta: 10,
        decliningDelta: -10,
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

export function loadCustomerSentimentEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerSentimentEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-sentiment-engine.config.json"),
    join(repositoryRoot, "config", "customer-sentiment-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CustomerSentimentEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerSentimentEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerSentimentEngineConfiguration> = {},
): CustomerSentimentEngineConfiguration {
  const fileConfig = repositoryRoot ? loadCustomerSentimentEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CustomerSentimentEngineConfiguration> = {
    enabled: envBool(
      "CUSTOMER_SENTIMENT_ENGINE_ENABLED",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_SENTIMENT_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_SENTIMENT_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    frustrationThreshold: envInt(
      "CUSTOMER_SENTIMENT_ENGINE_FRUSTRATION_THRESHOLD",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.frustrationThreshold,
    ),
    loggingLevel: envString(
      "CUSTOMER_SENTIMENT_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerSentimentEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_SENTIMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_SENTIMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
