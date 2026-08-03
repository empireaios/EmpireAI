/** X2-20 — Externalized Autonomous Portfolio Board configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AutonomousPortfolioBoardConfiguration = {
  enabled: boolean;
  executiveDecisionRulesEnabled: boolean;
  strategicPrioritizationRulesEnabled: boolean;
  governancePoliciesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies: true;
  requireApprovalForStrategicExecution: boolean;
  preserveExecutiveDecisionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseGovernanceIntegrity: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  minimumDecisionConfidence: number;
  highDecisionConfidenceThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION: AutonomousPortfolioBoardConfiguration =
  {
    enabled: true,
    executiveDecisionRulesEnabled: true,
    strategicPrioritizationRulesEnabled: true,
    governancePoliciesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies: true,
    requireApprovalForStrategicExecution: true,
    preserveExecutiveDecisionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseGovernanceIntegrity: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    minimumDecisionConfidence: 40,
    highDecisionConfidenceThreshold: 75,
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

export function loadAutonomousPortfolioBoardConfigFile(
  repositoryRoot: string,
): Partial<AutonomousPortfolioBoardConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-portfolio-board.config.json"),
    join(repositoryRoot, "config", "autonomous-portfolio-board.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousPortfolioBoardConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousPortfolioBoardConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousPortfolioBoardConfiguration> = {},
): AutonomousPortfolioBoardConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousPortfolioBoardConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AutonomousPortfolioBoardConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_PORTFOLIO_BOARD_ENABLED",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AUTONOMOUS_PORTFOLIO_BOARD_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_PORTFOLIO_BOARD_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.maxRetryAttempts,
    ),
    highDecisionConfidenceThreshold: envInt(
      "AUTONOMOUS_PORTFOLIO_BOARD_HIGH_CONFIDENCE_THRESHOLD",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.highDecisionConfidenceThreshold,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_PORTFOLIO_BOARD_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.loggingLevel,
    ) as AutonomousPortfolioBoardConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_PORTFOLIO_BOARD_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_PORTFOLIO_BOARD_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteStrategicDecisionsAutomaticallyBeyondConfiguredApprovalPolicies: true,
    preserveExecutiveDecisionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseGovernanceIntegrity: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
