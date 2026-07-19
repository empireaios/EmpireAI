/** R2-08 — Externalized Supplier Ranking Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierRankingEngineConfiguration = {
  enabled: boolean;
  scoringRulesEnabled: boolean;
  weightingRulesEnabled: boolean;
  qualityWeight: number;
  pricingWeight: number;
  inventoryReliabilityWeight: number;
  fulfilmentReliabilityWeight: number;
  responsivenessWeight: number;
  highPerformerThreshold: number;
  decliningPerformanceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION: SupplierRankingEngineConfiguration =
  {
    enabled: true,
    scoringRulesEnabled: true,
    weightingRulesEnabled: true,
    qualityWeight: 0.25,
    pricingWeight: 0.2,
    inventoryReliabilityWeight: 0.25,
    fulfilmentReliabilityWeight: 0.2,
    responsivenessWeight: 0.1,
    highPerformerThreshold: 80,
    decliningPerformanceThreshold: 15,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
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

export function loadSupplierRankingEngineConfigFile(
  repositoryRoot: string,
): Partial<SupplierRankingEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-ranking-engine.config.json"),
    join(repositoryRoot, "config", "supplier-ranking-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierRankingEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierRankingEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierRankingEngineConfiguration> = {},
): SupplierRankingEngineConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierRankingEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierRankingEngineConfiguration> = {
    enabled: envBool(
      "SUPPLIER_RANKING_ENGINE_ENABLED",
      DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION.enabled,
    ),
    highPerformerThreshold: envInt(
      "SUPPLIER_RANKING_ENGINE_HIGH_PERFORMER_THRESHOLD",
      DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION.highPerformerThreshold,
    ),
    decliningPerformanceThreshold: envInt(
      "SUPPLIER_RANKING_ENGINE_DECLINING_THRESHOLD",
      DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION.decliningPerformanceThreshold,
    ),
    loggingLevel: envString(
      "SUPPLIER_RANKING_ENGINE_LOG_LEVEL",
      DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION.loggingLevel,
    ) as SupplierRankingEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_RANKING_ENGINE_AUTO_RECOVER",
      DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_RANKING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
