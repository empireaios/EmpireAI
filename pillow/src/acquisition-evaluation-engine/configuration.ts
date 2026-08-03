/** X2-15 — Externalized Acquisition Evaluation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AcquisitionEvaluationEngineConfiguration = {
  enabled: boolean;
  candidateDiscoveryRulesEnabled: boolean;
  evaluationRulesEnabled: boolean;
  strategicFitRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendUsingUnvalidatedInformation: true;
  preserveEvaluationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  minimumStrategicFitThreshold: number;
  minimumFinancialScoreThreshold: number;
  maximumRiskScoreThreshold: number;
  pursueCompositeThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION: AcquisitionEvaluationEngineConfiguration =
  {
    enabled: true,
    candidateDiscoveryRulesEnabled: true,
    evaluationRulesEnabled: true,
    strategicFitRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendUsingUnvalidatedInformation: true,
    preserveEvaluationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    minimumStrategicFitThreshold: 55,
    minimumFinancialScoreThreshold: 50,
    maximumRiskScoreThreshold: 70,
    pursueCompositeThreshold: 70,
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

export function loadAcquisitionEvaluationEngineConfigFile(
  repositoryRoot: string,
): Partial<AcquisitionEvaluationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "acquisition-evaluation-engine.config.json"),
    join(repositoryRoot, "config", "acquisition-evaluation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AcquisitionEvaluationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAcquisitionEvaluationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AcquisitionEvaluationEngineConfiguration> = {},
): AcquisitionEvaluationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadAcquisitionEvaluationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AcquisitionEvaluationEngineConfiguration> = {
    enabled: envBool(
      "ACQUISITION_EVALUATION_ENGINE_ENABLED",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "ACQUISITION_EVALUATION_ENGINE_TIMEOUT_MS",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ACQUISITION_EVALUATION_ENGINE_MAX_RETRIES",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    pursueCompositeThreshold: envInt(
      "ACQUISITION_EVALUATION_ENGINE_PURSUE_THRESHOLD",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.pursueCompositeThreshold,
    ),
    loggingLevel: envString(
      "ACQUISITION_EVALUATION_ENGINE_LOG_LEVEL",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as AcquisitionEvaluationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ACQUISITION_EVALUATION_ENGINE_AUTO_RECOVER",
      DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ACQUISITION_EVALUATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendUsingUnvalidatedInformation: true,
    preserveEvaluationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
