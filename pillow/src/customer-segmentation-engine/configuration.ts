/** R4-16 — Externalized Customer Segmentation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SegmentationRule = {
  ruleId: string;
  label: string;
  segmentType: string;
  segmentName: string;
  minConfidence: number;
  enabled: boolean;
};

export type ClassificationRule = {
  ruleId: string;
  label: string;
  threshold: number;
  tierLabel: string;
  enabled: boolean;
};

export type DynamicUpdateRule = {
  ruleId: string;
  label: string;
  recheckOnChange: boolean;
  enabled: boolean;
};

export type CustomerSegmentationEngineConfiguration = {
  enabled: boolean;
  segmentationRulesEnabled: boolean;
  classificationRulesEnabled: boolean;
  dynamicUpdateRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  highValueClvThreshold: number;
  frequentPurchaseThreshold: number;
  negativeSentimentThreshold: number;
  highRiskScoreThreshold: number;
  minSegmentConfidence: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  segmentationRules: SegmentationRule[];
  classificationRules: ClassificationRule[];
  dynamicUpdateRules: DynamicUpdateRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION: CustomerSegmentationEngineConfiguration =
  {
    enabled: true,
    segmentationRulesEnabled: true,
    classificationRulesEnabled: true,
    dynamicUpdateRulesEnabled: true,
    validationRulesEnabled: true,
    highValueClvThreshold: 500,
    frequentPurchaseThreshold: 3,
    negativeSentimentThreshold: 40,
    highRiskScoreThreshold: 65,
    minSegmentConfidence: 50,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    segmentationRules: [
      {
        ruleId: "high_value",
        label: "High value customers",
        segmentType: "value",
        segmentName: "high_value",
        minConfidence: 60,
        enabled: true,
      },
      {
        ruleId: "loyal_members",
        label: "Loyal programme members",
        segmentType: "loyalty",
        segmentName: "loyal_member",
        minConfidence: 55,
        enabled: true,
      },
      {
        ruleId: "at_risk",
        label: "At-risk customers",
        segmentType: "risk",
        segmentName: "at_risk",
        minConfidence: 60,
        enabled: true,
      },
      {
        ruleId: "frequent_buyers",
        label: "Frequent purchasers",
        segmentType: "purchasing",
        segmentName: "frequent_buyer",
        minConfidence: 50,
        enabled: true,
      },
    ],
    classificationRules: [
      { ruleId: "value_high", label: "High value tier", threshold: 500, tierLabel: "high", enabled: true },
      { ruleId: "value_premium", label: "Premium value tier", threshold: 1000, tierLabel: "premium", enabled: true },
    ],
    dynamicUpdateRules: [
      { ruleId: "recheck_on_assignment", label: "Recheck on reassignment", recheckOnChange: true, enabled: true },
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

export function loadCustomerSegmentationEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerSegmentationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-segmentation-engine.config.json"),
    join(repositoryRoot, "config", "customer-segmentation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CustomerSegmentationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerSegmentationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerSegmentationEngineConfiguration> = {},
): CustomerSegmentationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCustomerSegmentationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CustomerSegmentationEngineConfiguration> = {
    enabled: envBool(
      "CUSTOMER_SEGMENTATION_ENGINE_ENABLED",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_SEGMENTATION_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_SEGMENTATION_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highValueClvThreshold: envInt(
      "CUSTOMER_SEGMENTATION_ENGINE_HIGH_VALUE_THRESHOLD",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.highValueClvThreshold,
    ),
    loggingLevel: envString(
      "CUSTOMER_SEGMENTATION_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerSegmentationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_SEGMENTATION_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_SEGMENTATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
