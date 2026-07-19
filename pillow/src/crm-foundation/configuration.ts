/** R4-02 — Externalized CRM Foundation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LIFECYCLE_STATUSES } from "./paths.js";

export type LifecycleRule = {
  status: (typeof LIFECYCLE_STATUSES)[number];
  label: string;
  enabled: boolean;
};

export type TaggingRule = {
  ruleId: string;
  label: string;
  maxTagsPerCustomer: number;
  enabled: boolean;
};

export type SearchRule = {
  ruleId: string;
  label: string;
  minQueryLength: number;
  enabled: boolean;
};

export type CrmFoundationConfiguration = {
  enabled: boolean;
  lifecycleRulesEnabled: boolean;
  taggingRulesEnabled: boolean;
  searchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultSearchLimit: number;
  lifecycleRules: LifecycleRule[];
  taggingRules: TaggingRule[];
  searchRules: SearchRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CRM_FOUNDATION_CONFIGURATION: CrmFoundationConfiguration = {
  enabled: true,
  lifecycleRulesEnabled: true,
  taggingRulesEnabled: true,
  searchRulesEnabled: true,
  validationRulesEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultSearchLimit: 50,
  lifecycleRules: [
    { status: "prospect", label: "Prospect", enabled: true },
    { status: "active", label: "Active", enabled: true },
    { status: "inactive", label: "Inactive", enabled: true },
    { status: "churned", label: "Churned", enabled: true },
    { status: "suspended", label: "Suspended", enabled: true },
  ],
  taggingRules: [
    { ruleId: "default_tags", label: "Default tagging", maxTagsPerCustomer: 20, enabled: true },
  ],
  searchRules: [
    { ruleId: "default_search", label: "Default search", minQueryLength: 2, enabled: true },
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

export function loadCrmFoundationConfigFile(
  repositoryRoot: string,
): Partial<CrmFoundationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "crm-foundation.config.json"),
    join(repositoryRoot, "config", "crm-foundation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CrmFoundationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCrmFoundationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrmFoundationConfiguration> = {},
): CrmFoundationConfiguration {
  const fileConfig = repositoryRoot ? loadCrmFoundationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CrmFoundationConfiguration> = {
    enabled: envBool("CRM_FOUNDATION_ENABLED", DEFAULT_CRM_FOUNDATION_CONFIGURATION.enabled),
    connectionTimeoutMs: envInt(
      "CRM_FOUNDATION_TIMEOUT_MS",
      DEFAULT_CRM_FOUNDATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CRM_FOUNDATION_MAX_RETRIES",
      DEFAULT_CRM_FOUNDATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CRM_FOUNDATION_LOG_LEVEL",
      DEFAULT_CRM_FOUNDATION_CONFIGURATION.loggingLevel,
    ) as CrmFoundationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CRM_FOUNDATION_AUTO_RECOVER",
      DEFAULT_CRM_FOUNDATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CRM_FOUNDATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
