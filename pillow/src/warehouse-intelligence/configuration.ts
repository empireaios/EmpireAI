/** R2-14 — Externalized Warehouse Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WarehouseIntelligenceConfiguration = {
  enabled: boolean;
  warehouseAllocationRulesEnabled: boolean;
  inventoryDistributionRulesEnabled: boolean;
  capacityThresholdPercent: number;
  shortageThresholdPercent: number;
  overstockThresholdPercent: number;
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

export const DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION: WarehouseIntelligenceConfiguration = {
  enabled: true,
  warehouseAllocationRulesEnabled: true,
  inventoryDistributionRulesEnabled: true,
  capacityThresholdPercent: 85,
  shortageThresholdPercent: 15,
  overstockThresholdPercent: 90,
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

export function loadWarehouseIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<WarehouseIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "warehouse-intelligence.config.json"),
    join(repositoryRoot, "config", "warehouse-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<WarehouseIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWarehouseIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WarehouseIntelligenceConfiguration> = {},
): WarehouseIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadWarehouseIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<WarehouseIntelligenceConfiguration> = {
    enabled: envBool(
      "WAREHOUSE_INTELLIGENCE_ENABLED",
      DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    capacityThresholdPercent: envInt(
      "WAREHOUSE_INTELLIGENCE_CAPACITY_THRESHOLD",
      DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION.capacityThresholdPercent,
    ),
    loggingLevel: envString(
      "WAREHOUSE_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as WarehouseIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WAREHOUSE_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WAREHOUSE_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
