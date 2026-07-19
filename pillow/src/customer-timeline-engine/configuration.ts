/** R4-03 — Externalized Customer Timeline Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EVENT_TYPES } from "./paths.js";

export type RetentionRule = {
  ruleId: string;
  label: string;
  maxRecordsPerCustomer: number;
  enabled: boolean;
};

export type EventClassificationRule = {
  eventType: (typeof EVENT_TYPES)[number];
  label: string;
  enabled: boolean;
};

export type TimelineSearchRule = {
  ruleId: string;
  label: string;
  minQueryLength: number;
  enabled: boolean;
};

export type CustomerTimelineEngineConfiguration = {
  enabled: boolean;
  retentionRulesEnabled: boolean;
  eventClassificationRulesEnabled: boolean;
  searchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultSearchLimit: number;
  retentionRules: RetentionRule[];
  eventClassificationRules: EventClassificationRule[];
  searchRules: TimelineSearchRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION: CustomerTimelineEngineConfiguration =
  {
    enabled: true,
    retentionRulesEnabled: true,
    eventClassificationRulesEnabled: true,
    searchRulesEnabled: true,
    validationRulesEnabled: true,
    duplicateDetectionEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    defaultSearchLimit: 100,
    retentionRules: [
      { ruleId: "default_retention", label: "Default retention", maxRecordsPerCustomer: 10000, enabled: true },
    ],
    eventClassificationRules: [
      { eventType: "interaction", label: "Customer interaction", enabled: true },
      { eventType: "purchase", label: "Purchase", enabled: true },
      { eventType: "support", label: "Support activity", enabled: true },
      { eventType: "communication", label: "Communication", enabled: true },
      { eventType: "account_change", label: "Account change", enabled: true },
      { eventType: "milestone", label: "Customer milestone", enabled: true },
      { eventType: "event", label: "Generic event", enabled: true },
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

export function loadCustomerTimelineEngineConfigFile(
  repositoryRoot: string,
): Partial<CustomerTimelineEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-timeline-engine.config.json"),
    join(repositoryRoot, "config", "customer-timeline-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CustomerTimelineEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerTimelineEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerTimelineEngineConfiguration> = {},
): CustomerTimelineEngineConfiguration {
  const fileConfig = repositoryRoot ? loadCustomerTimelineEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CustomerTimelineEngineConfiguration> = {
    enabled: envBool(
      "CUSTOMER_TIMELINE_ENGINE_ENABLED",
      DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CUSTOMER_TIMELINE_ENGINE_TIMEOUT_MS",
      DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CUSTOMER_TIMELINE_ENGINE_MAX_RETRIES",
      DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CUSTOMER_TIMELINE_ENGINE_LOG_LEVEL",
      DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION.loggingLevel,
    ) as CustomerTimelineEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_TIMELINE_ENGINE_AUTO_RECOVER",
      DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_TIMELINE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
