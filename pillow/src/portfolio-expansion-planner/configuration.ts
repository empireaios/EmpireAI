/** X2-18 — Externalized Portfolio Expansion Planner configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioExpansionPlannerConfiguration = {
  enabled: boolean;
  expansionEvaluationRulesEnabled: boolean;
  prioritizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies: true;
  requireApprovalForExpansionInitiation: boolean;
  preserveExpansionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  minimumInvestmentThreshold: number;
  highPriorityReturnThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION: PortfolioExpansionPlannerConfiguration =
  {
    enabled: true,
    expansionEvaluationRulesEnabled: true,
    prioritizationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies: true,
    requireApprovalForExpansionInitiation: true,
    preserveExpansionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    minimumInvestmentThreshold: 25,
    highPriorityReturnThreshold: 45,
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

export function loadPortfolioExpansionPlannerConfigFile(
  repositoryRoot: string,
): Partial<PortfolioExpansionPlannerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-expansion-planner.config.json"),
    join(repositoryRoot, "config", "portfolio-expansion-planner.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioExpansionPlannerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioExpansionPlannerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioExpansionPlannerConfiguration> = {},
): PortfolioExpansionPlannerConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioExpansionPlannerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioExpansionPlannerConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_EXPANSION_PLANNER_ENABLED",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_EXPANSION_PLANNER_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_EXPANSION_PLANNER_MAX_RETRIES",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.maxRetryAttempts,
    ),
    highPriorityReturnThreshold: envInt(
      "PORTFOLIO_EXPANSION_PLANNER_HIGH_PRIORITY_THRESHOLD",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.highPriorityReturnThreshold,
    ),
    loggingLevel: envString(
      "PORTFOLIO_EXPANSION_PLANNER_LOG_LEVEL",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.loggingLevel,
    ) as PortfolioExpansionPlannerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_EXPANSION_PLANNER_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_EXPANSION_PLANNER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverInitiateExpansionAutomaticallyBeyondConfiguredApprovalPolicies: true,
    preserveExpansionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
