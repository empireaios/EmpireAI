/** R1-15 — Externalized Marketplace Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketplaceCertificationConfiguration = {
  enabled: boolean;
  certificationScope: "full" | "connectors" | "normalization" | "health";
  requiredValidationRulesEnabled: boolean;
  passThresholdPercent: number;
  failureDetectionRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  includeSmokeTests: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION: MarketplaceCertificationConfiguration =
  {
    enabled: true,
    certificationScope: "full",
    requiredValidationRulesEnabled: true,
    passThresholdPercent: 85,
    failureDetectionRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 60000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    includeSmokeTests: true,
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

export function loadMarketplaceCertificationConfigFile(
  repositoryRoot: string,
): Partial<MarketplaceCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketplace-certification.config.json"),
    join(repositoryRoot, "config", "marketplace-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketplaceCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketplaceCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketplaceCertificationConfiguration> = {},
): MarketplaceCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketplaceCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketplaceCertificationConfiguration> = {
    enabled: envBool(
      "MARKETPLACE_CERTIFICATION_ENABLED",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "MARKETPLACE_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.passThresholdPercent,
    ),
    requestTimeoutMs: envInt(
      "MARKETPLACE_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETPLACE_CERTIFICATION_MAX_RETRIES",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETPLACE_CERTIFICATION_LOG_LEVEL",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as MarketplaceCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETPLACE_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
    includeSmokeTests: envBool(
      "MARKETPLACE_CERTIFICATION_INCLUDE_SMOKE_TESTS",
      DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION.includeSmokeTests,
    ),
  };

  return {
    ...DEFAULT_MARKETPLACE_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
