/** X3-03 — Externalized Scaling Decision Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ScalingDecisionEngineConfiguration = {
  enabled: boolean;
  decisionRulesEnabled: boolean;
  readinessAssessmentEnabled: boolean;
  riskAssessmentEnabled: boolean;
  rankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverApproveScalingWithoutValidation: true;
  preserveDecisionTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  readinessScaleThreshold: number;
  readinessHoldThreshold: number;
  riskRejectThreshold: number;
  minScalingConfidence: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION: ScalingDecisionEngineConfiguration =
  {
    enabled: true,
    decisionRulesEnabled: true,
    readinessAssessmentEnabled: true,
    riskAssessmentEnabled: true,
    rankingRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverApproveScalingWithoutValidation: true,
    preserveDecisionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    readinessScaleThreshold: 70,
    readinessHoldThreshold: 50,
    riskRejectThreshold: 70,
    minScalingConfidence: 55,
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

export function loadScalingDecisionEngineConfigFile(
  repositoryRoot: string,
): Partial<ScalingDecisionEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "scaling-decision-engine.config.json"),
    join(repositoryRoot, "config", "scaling-decision-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ScalingDecisionEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildScalingDecisionEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ScalingDecisionEngineConfiguration> = {},
): ScalingDecisionEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadScalingDecisionEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ScalingDecisionEngineConfiguration> = {
    enabled: envBool(
      "SCALING_DECISION_ENGINE_ENABLED",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SCALING_DECISION_ENGINE_TIMEOUT_MS",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SCALING_DECISION_ENGINE_MAX_RETRIES",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    readinessScaleThreshold: envInt(
      "SCALING_DECISION_ENGINE_READINESS_SCALE",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.readinessScaleThreshold,
    ),
    riskRejectThreshold: envInt(
      "SCALING_DECISION_ENGINE_RISK_REJECT",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.riskRejectThreshold,
    ),
    loggingLevel: envString(
      "SCALING_DECISION_ENGINE_LOG_LEVEL",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.loggingLevel,
    ) as ScalingDecisionEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SCALING_DECISION_ENGINE_AUTO_RECOVER",
      DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SCALING_DECISION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverApproveScalingWithoutValidation: true,
    preserveDecisionTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
