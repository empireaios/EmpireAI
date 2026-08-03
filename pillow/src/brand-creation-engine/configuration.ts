/** X1-05 — Externalized Brand Creation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BrandCreationEngineConfiguration = {
  enabled: boolean;
  namingRulesEnabled: boolean;
  identityGenerationRulesEnabled: boolean;
  brandGuidelineRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  preventDuplicateBrandIdentities: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxBrandsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION: BrandCreationEngineConfiguration = {
  enabled: true,
  namingRulesEnabled: true,
  identityGenerationRulesEnabled: true,
  brandGuidelineRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  preventDuplicateBrandIdentities: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  maxBrandsPerCycle: 12,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
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

export function loadBrandCreationEngineConfigFile(
  repositoryRoot: string,
): Partial<BrandCreationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "brand-creation-engine.config.json"),
    join(repositoryRoot, "config", "brand-creation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<BrandCreationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBrandCreationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BrandCreationEngineConfiguration> = {},
): BrandCreationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadBrandCreationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<BrandCreationEngineConfiguration> = {
    enabled: envBool(
      "BRAND_CREATION_ENGINE_ENABLED",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BRAND_CREATION_ENGINE_TIMEOUT_MS",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BRAND_CREATION_ENGINE_MAX_RETRIES",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BRAND_CREATION_ENGINE_LOG_LEVEL",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as BrandCreationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BRAND_CREATION_ENGINE_AUTO_RECOVER",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.autoRecover,
    ),
    maxBrandsPerCycle: envInt(
      "BRAND_CREATION_ENGINE_MAX_BRANDS",
      DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION.maxBrandsPerCycle,
    ),
  };

  return {
    ...DEFAULT_BRAND_CREATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    preventDuplicateBrandIdentities: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
