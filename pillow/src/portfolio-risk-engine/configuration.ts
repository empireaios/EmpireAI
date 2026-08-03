/** X2-07 — Externalized Portfolio Risk Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioRiskEngineConfiguration = {
  enabled: boolean;
  riskMonitoringRulesEnabled: boolean;
  riskScoringRulesEnabled: boolean;
  alertThresholdsEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverSuppressCriticalRisks: true;
  preserveRiskTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  criticalRiskScoreThreshold: number;
  highRiskScoreThreshold: number;
  alertPortfolioScoreThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION: PortfolioRiskEngineConfiguration =
  {
    enabled: true,
    riskMonitoringRulesEnabled: true,
    riskScoringRulesEnabled: true,
    alertThresholdsEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverSuppressCriticalRisks: true,
    preserveRiskTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    criticalRiskScoreThreshold: 80,
    highRiskScoreThreshold: 60,
    alertPortfolioScoreThreshold: 55,
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

export function loadPortfolioRiskEngineConfigFile(
  repositoryRoot: string,
): Partial<PortfolioRiskEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-risk-engine.config.json"),
    join(repositoryRoot, "config", "portfolio-risk-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<PortfolioRiskEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioRiskEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioRiskEngineConfiguration> = {},
): PortfolioRiskEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioRiskEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioRiskEngineConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_RISK_ENGINE_ENABLED",
      DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_RISK_ENGINE_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_RISK_ENGINE_MAX_RETRIES",
      DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PORTFOLIO_RISK_ENGINE_LOG_LEVEL",
      DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION.loggingLevel,
    ) as PortfolioRiskEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_RISK_ENGINE_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_RISK_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverSuppressCriticalRisks: true,
    preserveRiskTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
