/** X2-05 — Externalized Capital Distribution Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CapitalDistributionEngineConfiguration = {
  enabled: boolean;
  allocationRulesEnabled: boolean;
  roiEvaluationRulesEnabled: boolean;
  riskThresholdsEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAllocateBeyondApprovalPolicy: true;
  preserveAllocationTraceability: true;
  preserveFinancialIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxAutoApproveUnits: number;
  concentrationRiskThresholdPercent: number;
  minExpectedRoi: number;
  defaultPoolUnits: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION: CapitalDistributionEngineConfiguration =
  {
    enabled: true,
    allocationRulesEnabled: true,
    roiEvaluationRulesEnabled: true,
    riskThresholdsEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverAllocateBeyondApprovalPolicy: true,
    preserveAllocationTraceability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxAutoApproveUnits: 100,
    concentrationRiskThresholdPercent: 40,
    minExpectedRoi: 10,
    defaultPoolUnits: 1000,
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

export function loadCapitalDistributionEngineConfigFile(
  repositoryRoot: string,
): Partial<CapitalDistributionEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "capital-distribution-engine.config.json"),
    join(repositoryRoot, "config", "capital-distribution-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CapitalDistributionEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCapitalDistributionEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CapitalDistributionEngineConfiguration> = {},
): CapitalDistributionEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCapitalDistributionEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CapitalDistributionEngineConfiguration> = {
    enabled: envBool(
      "CAPITAL_DISTRIBUTION_ENGINE_ENABLED",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CAPITAL_DISTRIBUTION_ENGINE_TIMEOUT_MS",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CAPITAL_DISTRIBUTION_ENGINE_MAX_RETRIES",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    maxAutoApproveUnits: envInt(
      "CAPITAL_DISTRIBUTION_ENGINE_MAX_AUTO_APPROVE",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.maxAutoApproveUnits,
    ),
    loggingLevel: envString(
      "CAPITAL_DISTRIBUTION_ENGINE_LOG_LEVEL",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.loggingLevel,
    ) as CapitalDistributionEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CAPITAL_DISTRIBUTION_ENGINE_AUTO_RECOVER",
      DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CAPITAL_DISTRIBUTION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAllocateBeyondApprovalPolicy: true,
    preserveAllocationTraceability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
