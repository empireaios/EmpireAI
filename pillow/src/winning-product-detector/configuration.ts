/** X3-02 — Externalized Winning Product Detector configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WinningProductDetectorConfiguration = {
  enabled: boolean;
  productEvaluationRulesEnabled: boolean;
  breakoutDetectionEnabled: boolean;
  trendAnalysisEnabled: boolean;
  rankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverManipulateProductPerformanceData: true;
  preserveProductTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  breakoutVelocityThreshold: number;
  breakoutGrowthThreshold: number;
  decliningGrowthThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION: WinningProductDetectorConfiguration =
  {
    enabled: true,
    productEvaluationRulesEnabled: true,
    breakoutDetectionEnabled: true,
    trendAnalysisEnabled: true,
    rankingRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverManipulateProductPerformanceData: true,
    preserveProductTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    breakoutVelocityThreshold: 70,
    breakoutGrowthThreshold: 25,
    decliningGrowthThreshold: -10,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
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

export function loadWinningProductDetectorConfigFile(
  repositoryRoot: string,
): Partial<WinningProductDetectorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "winning-product-detector.config.json"),
    join(repositoryRoot, "config", "winning-product-detector.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<WinningProductDetectorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWinningProductDetectorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WinningProductDetectorConfiguration> = {},
): WinningProductDetectorConfiguration {
  const fileConfig = repositoryRoot
    ? loadWinningProductDetectorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<WinningProductDetectorConfiguration> = {
    enabled: envBool(
      "WINNING_PRODUCT_DETECTOR_ENABLED",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "WINNING_PRODUCT_DETECTOR_TIMEOUT_MS",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "WINNING_PRODUCT_DETECTOR_MAX_RETRIES",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.maxRetryAttempts,
    ),
    breakoutVelocityThreshold: envInt(
      "WINNING_PRODUCT_DETECTOR_BREAKOUT_VELOCITY",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.breakoutVelocityThreshold,
    ),
    breakoutGrowthThreshold: envInt(
      "WINNING_PRODUCT_DETECTOR_BREAKOUT_GROWTH",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.breakoutGrowthThreshold,
    ),
    loggingLevel: envString(
      "WINNING_PRODUCT_DETECTOR_LOG_LEVEL",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.loggingLevel,
    ) as WinningProductDetectorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WINNING_PRODUCT_DETECTOR_AUTO_RECOVER",
      DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WINNING_PRODUCT_DETECTOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverManipulateProductPerformanceData: true,
    preserveProductTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
