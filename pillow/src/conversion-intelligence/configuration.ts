/** R5-14 — Externalized Conversion Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ConversionIntelligenceConfiguration = {
  enabled: boolean;
  funnelTrackingRulesEnabled: boolean;
  conversionCalculationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverModifyProductionCampaignsWithoutValidation: true;
  maskSensitiveValues: true;
  bottleneckDropOffThresholdPercent: number;
  abandonmentThresholdPercent: number;
  efficiencyFloorPercent: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION: ConversionIntelligenceConfiguration = {
  enabled: true,
  funnelTrackingRulesEnabled: true,
  conversionCalculationRulesEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverModifyProductionCampaignsWithoutValidation: true,
  maskSensitiveValues: true,
  bottleneckDropOffThresholdPercent: 45,
  abandonmentThresholdPercent: 60,
  efficiencyFloorPercent: 40,
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

export function loadConversionIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<ConversionIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "conversion-intelligence.config.json"),
    join(repositoryRoot, "config", "conversion-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ConversionIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildConversionIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ConversionIntelligenceConfiguration> = {},
): ConversionIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadConversionIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ConversionIntelligenceConfiguration> = {
    enabled: envBool(
      "CONVERSION_INTELLIGENCE_ENABLED",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CONVERSION_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CONVERSION_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CONVERSION_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as ConversionIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CONVERSION_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
    bottleneckDropOffThresholdPercent: envInt(
      "CONVERSION_INTELLIGENCE_BOTTLENECK_THRESHOLD",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.bottleneckDropOffThresholdPercent,
    ),
    abandonmentThresholdPercent: envInt(
      "CONVERSION_INTELLIGENCE_ABANDONMENT_THRESHOLD",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.abandonmentThresholdPercent,
    ),
    efficiencyFloorPercent: envInt(
      "CONVERSION_INTELLIGENCE_EFFICIENCY_FLOOR",
      DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION.efficiencyFloorPercent,
    ),
  };

  return {
    ...DEFAULT_CONVERSION_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverModifyProductionCampaignsWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
