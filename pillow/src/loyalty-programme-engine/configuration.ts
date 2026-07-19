/** R4-12 — Externalized Loyalty Programme Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LOYALTY_TIERS } from "./paths.js";

export type PointsCalculationRule = {
  ruleId: string;
  label: string;
  pointsPerUnit: number;
  maxPointsPerTransaction: number;
  enabled: boolean;
};

export type TierRule = {
  ruleId: string;
  tier: (typeof LOYALTY_TIERS)[number];
  minPoints: number;
  enabled: boolean;
};

export type RewardRule = {
  ruleId: string;
  label: string;
  minPointsCost: number;
  maxPointsCost: number;
  enabled: boolean;
};

export type LoyaltyProgrammeEngineConfiguration = {
  enabled: boolean;
  pointsCalculationRulesEnabled: boolean;
  tierRulesEnabled: boolean;
  rewardRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  abuseDetectionEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  maxPointsPerAward: number;
  maxRedemptionsPerHour: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  pointsCalculationRules: PointsCalculationRule[];
  tierRules: TierRule[];
  rewardRules: RewardRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION: LoyaltyProgrammeEngineConfiguration =
  {
    enabled: true,
    pointsCalculationRulesEnabled: true,
    tierRulesEnabled: true,
    rewardRulesEnabled: true,
    validationRulesEnabled: true,
    abuseDetectionEnabled: true,
    duplicateDetectionEnabled: true,
    maxPointsPerAward: 10000,
    maxRedemptionsPerHour: 5,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    pointsCalculationRules: [
      {
        ruleId: "default_purchase",
        label: "Default purchase points",
        pointsPerUnit: 1,
        maxPointsPerTransaction: 5000,
        enabled: true,
      },
    ],
    tierRules: [
      { ruleId: "bronze", tier: "bronze", minPoints: 0, enabled: true },
      { ruleId: "silver", tier: "silver", minPoints: 500, enabled: true },
      { ruleId: "gold", tier: "gold", minPoints: 2000, enabled: true },
      { ruleId: "platinum", tier: "platinum", minPoints: 5000, enabled: true },
    ],
    rewardRules: [
      {
        ruleId: "default_reward",
        label: "Standard reward redemption",
        minPointsCost: 100,
        maxPointsCost: 5000,
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

export function loadLoyaltyProgrammeEngineConfigFile(
  repositoryRoot: string,
): Partial<LoyaltyProgrammeEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "loyalty-programme-engine.config.json"),
    join(repositoryRoot, "config", "loyalty-programme-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LoyaltyProgrammeEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLoyaltyProgrammeEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LoyaltyProgrammeEngineConfiguration> = {},
): LoyaltyProgrammeEngineConfiguration {
  const fileConfig = repositoryRoot ? loadLoyaltyProgrammeEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LoyaltyProgrammeEngineConfiguration> = {
    enabled: envBool(
      "LOYALTY_PROGRAMME_ENGINE_ENABLED",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "LOYALTY_PROGRAMME_ENGINE_TIMEOUT_MS",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LOYALTY_PROGRAMME_ENGINE_MAX_RETRIES",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    maxPointsPerAward: envInt(
      "LOYALTY_PROGRAMME_ENGINE_MAX_POINTS_AWARD",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.maxPointsPerAward,
    ),
    loggingLevel: envString(
      "LOYALTY_PROGRAMME_ENGINE_LOG_LEVEL",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.loggingLevel,
    ) as LoyaltyProgrammeEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LOYALTY_PROGRAMME_ENGINE_AUTO_RECOVER",
      DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LOYALTY_PROGRAMME_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
