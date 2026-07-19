/** R4-11 — Externalized Review Management Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { MARKETPLACE_CHANNELS, REVIEW_SENTIMENTS } from "./paths.js";

export type CollectionRule = {
  ruleId: string;
  label: string;
  minRating: number;
  maxRating: number;
  requireComment: boolean;
  enabled: boolean;
};

export type MarketplaceImportRule = {
  ruleId: string;
  label: string;
  marketplace: (typeof MARKETPLACE_CHANNELS)[number];
  requireOrderReference: boolean;
  requireExternalReviewId: boolean;
  enabled: boolean;
};

export type ReputationAlertRule = {
  ruleId: string;
  label: string;
  sentiment: (typeof REVIEW_SENTIMENTS)[number];
  minRating: number;
  maxRating: number;
  severity: "low" | "medium" | "high";
  enabled: boolean;
};

export type ReviewManagementEngineConfiguration = {
  enabled: boolean;
  collectionRulesEnabled: boolean;
  marketplaceImportRulesEnabled: boolean;
  reputationAlertRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  negativeRatingThreshold: number;
  positiveRatingThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  collectionRules: CollectionRule[];
  marketplaceImportRules: MarketplaceImportRule[];
  reputationAlertRules: ReputationAlertRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION: ReviewManagementEngineConfiguration =
  {
    enabled: true,
    collectionRulesEnabled: true,
    marketplaceImportRulesEnabled: true,
    reputationAlertRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    negativeRatingThreshold: 2,
    positiveRatingThreshold: 4,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    collectionRules: [
      {
        ruleId: "default_collection",
        label: "Default review collection",
        minRating: 1,
        maxRating: 5,
        requireComment: false,
        enabled: true,
      },
    ],
    marketplaceImportRules: [
      {
        ruleId: "amazon_import",
        label: "Amazon marketplace import",
        marketplace: "amazon",
        requireOrderReference: true,
        requireExternalReviewId: true,
        enabled: true,
      },
      {
        ruleId: "shopify_import",
        label: "Shopify marketplace import",
        marketplace: "shopify",
        requireOrderReference: true,
        requireExternalReviewId: true,
        enabled: true,
      },
      {
        ruleId: "direct_import",
        label: "Direct review import",
        marketplace: "direct",
        requireOrderReference: false,
        requireExternalReviewId: false,
        enabled: true,
      },
    ],
    reputationAlertRules: [
      {
        ruleId: "negative_review_alert",
        label: "Negative review alert",
        sentiment: "negative",
        minRating: 1,
        maxRating: 2,
        severity: "high",
        enabled: true,
      },
      {
        ruleId: "positive_review_alert",
        label: "Positive review alert",
        sentiment: "positive",
        minRating: 4,
        maxRating: 5,
        severity: "low",
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

export function loadReviewManagementEngineConfigFile(
  repositoryRoot: string,
): Partial<ReviewManagementEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "review-management-engine.config.json"),
    join(repositoryRoot, "config", "review-management-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ReviewManagementEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildReviewManagementEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ReviewManagementEngineConfiguration> = {},
): ReviewManagementEngineConfiguration {
  const fileConfig = repositoryRoot ? loadReviewManagementEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ReviewManagementEngineConfiguration> = {
    enabled: envBool(
      "REVIEW_MANAGEMENT_ENGINE_ENABLED",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "REVIEW_MANAGEMENT_ENGINE_TIMEOUT_MS",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REVIEW_MANAGEMENT_ENGINE_MAX_RETRIES",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    negativeRatingThreshold: envInt(
      "REVIEW_MANAGEMENT_ENGINE_NEGATIVE_THRESHOLD",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.negativeRatingThreshold,
    ),
    positiveRatingThreshold: envInt(
      "REVIEW_MANAGEMENT_ENGINE_POSITIVE_THRESHOLD",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.positiveRatingThreshold,
    ),
    loggingLevel: envString(
      "REVIEW_MANAGEMENT_ENGINE_LOG_LEVEL",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as ReviewManagementEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REVIEW_MANAGEMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REVIEW_MANAGEMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
