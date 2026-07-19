/** R4-01 — Externalized Customer Identity Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { IDENTIFIER_TYPES } from "./paths.js";

export type IdentityMatchingRule = {
  identifierType: (typeof IDENTIFIER_TYPES)[number];
  label: string;
  enabled: boolean;
  minConfidenceScore: number;
};

export type IdentityMergeRule = {
  ruleId: string;
  label: string;
  requireValidation: boolean;
  enabled: boolean;
};

export type CustomerIdentityEngineConfiguration = {
  enabled: boolean;
  identityMatchingRulesEnabled: boolean;
  identityMergeRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  minMatchConfidenceScore: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  matchingRules: IdentityMatchingRule[];
  mergeRules: IdentityMergeRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION: CustomerIdentityEngineConfiguration =
  {
    enabled: true,
    identityMatchingRulesEnabled: true,
    identityMergeRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    minMatchConfidenceScore: 80,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    matchingRules: [
      { identifierType: "email", label: "Email match", enabled: true, minConfidenceScore: 90 },
      { identifierType: "phone", label: "Phone match", enabled: true, minConfidenceScore: 85 },
      { identifierType: "marketplace", label: "Marketplace ID match", enabled: true, minConfidenceScore: 80 },
      { identifierType: "communication", label: "Communication channel match", enabled: true, minConfidenceScore: 75 },
      { identifierType: "external", label: "External ID match", enabled: true, minConfidenceScore: 70 },
    ],
    mergeRules: [
      { ruleId: "validated_merge", label: "Require validation before merge", requireValidation: true, enabled: true },
      { ruleId: "preserve_target", label: "Preserve target identity as primary", requireValidation: false, enabled: true },
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

export function loadCustomerIdentityEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerIdentityEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-identity-engine.config.json"),
    join(repositoryRoot, "config", "customer-identity-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CustomerIdentityEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerIdentityEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerIdentityEngineConfiguration> = {},
): CustomerIdentityEngineConfiguration {
  const fileConfig = repositoryRoot ? loadCustomerIdentityEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CustomerIdentityEngineConfiguration> = {
    enabled: envBool("CUSTOMER_IDENTITY_ENGINE_ENABLED", DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.enabled),
    connectionTimeoutMs: envInt(
      "CUSTOMER_IDENTITY_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_IDENTITY_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    minMatchConfidenceScore: envInt(
      "CUSTOMER_IDENTITY_ENGINE_MIN_MATCH_SCORE",
      DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.minMatchConfidenceScore,
    ),
    loggingLevel: envString(
      "CUSTOMER_IDENTITY_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerIdentityEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_IDENTITY_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_IDENTITY_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
