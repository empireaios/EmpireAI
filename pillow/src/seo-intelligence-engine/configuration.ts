/** R5-06 — Externalized SEO Intelligence Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SeoIntelligenceConfiguration = {
  enabled: boolean;
  keywordTrackingRulesEnabled: boolean;
  rankingMonitoringFrequencyMinutes: number;
  seoScoringRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  allowAutomaticContentModification: false;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultWebsiteReference: string;
  maskSensitiveValues: true;
};

export const DEFAULT_SEO_INTELLIGENCE_CONFIGURATION: SeoIntelligenceConfiguration = {
  enabled: true,
  keywordTrackingRulesEnabled: true,
  rankingMonitoringFrequencyMinutes: 60,
  seoScoringRulesEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  allowAutomaticContentModification: false,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultWebsiteReference: "site-empireai-default",
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

export function loadSeoIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<SeoIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "seo-intelligence-engine.config.json"),
    join(repositoryRoot, "config", "seo-intelligence-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SeoIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSeoIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SeoIntelligenceConfiguration> = {},
): SeoIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadSeoIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SeoIntelligenceConfiguration> = {
    enabled: envBool(
      "SEO_INTELLIGENCE_ENABLED",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    rankingMonitoringFrequencyMinutes: envInt(
      "SEO_INTELLIGENCE_RANKING_FREQUENCY_MINUTES",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.rankingMonitoringFrequencyMinutes,
    ),
    connectionTimeoutMs: envInt(
      "SEO_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SEO_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SEO_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as SeoIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SEO_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_SEO_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SEO_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    allowAutomaticContentModification: false,
    maskSensitiveValues: true,
  };
}
