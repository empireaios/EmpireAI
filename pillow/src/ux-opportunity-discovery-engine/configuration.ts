/** T5-03 — Externalized UX Opportunity Discovery configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type UxOpportunityDiscoveryConfiguration = {
  enabled: boolean;
  continuousDiscoveryEnabled: boolean;
  discoveryFrequencyMs: number;
  prioritizationRulesEnabled: boolean;
  impactScoringRulesEnabled: boolean;
  complexityScoringRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  discoveryTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryDiscoveries: number;
  deduplicateOpportunities: boolean;
  discoverOnlyMode: boolean;
};

export const DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION: UxOpportunityDiscoveryConfiguration =
  {
    enabled: true,
    continuousDiscoveryEnabled: true,
    discoveryFrequencyMs: 8000,
    prioritizationRulesEnabled: true,
    impactScoringRulesEnabled: true,
    complexityScoringRulesEnabled: true,
    confidenceThreshold: 0.45,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    discoveryTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryDiscoveries: 120,
    deduplicateOpportunities: true,
    discoverOnlyMode: true,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadUxOpportunityDiscoveryConfigFile(
  repositoryRoot: string,
): Partial<UxOpportunityDiscoveryConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ux-opportunity-discovery.config.json"),
    join(repositoryRoot, "config", "ux-opportunity-discovery.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<UxOpportunityDiscoveryConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildUxOpportunityDiscoveryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UxOpportunityDiscoveryConfiguration> = {},
): UxOpportunityDiscoveryConfiguration {
  const fileConfig = repositoryRoot
    ? loadUxOpportunityDiscoveryConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<UxOpportunityDiscoveryConfiguration> = {
    enabled: envBool(
      "UX_OPPORTUNITY_DISCOVERY_ENABLED",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.enabled,
    ),
    continuousDiscoveryEnabled: envBool(
      "UX_OPPORTUNITY_DISCOVERY_CONTINUOUS",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.continuousDiscoveryEnabled,
    ),
    discoveryFrequencyMs: envInt(
      "UX_OPPORTUNITY_DISCOVERY_FREQUENCY_MS",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.discoveryFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "UX_OPPORTUNITY_DISCOVERY_CONFIDENCE_THRESHOLD",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "UX_OPPORTUNITY_DISCOVERY_MAX_RETRIES",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.maxRetryAttempts,
    ),
    discoveryTimeoutMs: envInt(
      "UX_OPPORTUNITY_DISCOVERY_TIMEOUT_MS",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.discoveryTimeoutMs,
    ),
    loggingLevel: envString(
      "UX_OPPORTUNITY_DISCOVERY_LOG_LEVEL",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.loggingLevel,
    ) as UxOpportunityDiscoveryConfiguration["loggingLevel"],
    autoRecover: envBool(
      "UX_OPPORTUNITY_DISCOVERY_AUTO_RECOVER",
      DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_UX_OPPORTUNITY_DISCOVERY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    discoverOnlyMode: true,
  };
}
