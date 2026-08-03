/** X3-13 — Externalized Scaling Risk Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ScalingRiskMonitorConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  scalingRiskMonitoringEnabled: boolean;
  operationalRiskMonitoringEnabled: boolean;
  financialRiskMonitoringEnabled: boolean;
  supplierRiskMonitoringEnabled: boolean;
  marketingRiskMonitoringEnabled: boolean;
  workforceRiskMonitoringEnabled: boolean;
  infrastructureRiskMonitoringEnabled: boolean;
  uncontrolledExpansionDetectionEnabled: boolean;
  riskRankingEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSuppressCriticalScalingRisks: true;
  preserveRiskTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  riskProbabilityThreshold: number;
  highSeverityThreshold: number;
  criticalSeverityThreshold: number;
  uncontrolledExpansionThreshold: number;
  operationalRiskThreshold: number;
  financialRiskThreshold: number;
  supplierRiskThreshold: number;
  marketingRiskThreshold: number;
  workforceRiskThreshold: number;
  infrastructureRiskThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION: ScalingRiskMonitorConfiguration = {
  enabled: true,
  monitoringRulesEnabled: true,
  scalingRiskMonitoringEnabled: true,
  operationalRiskMonitoringEnabled: true,
  financialRiskMonitoringEnabled: true,
  supplierRiskMonitoringEnabled: true,
  marketingRiskMonitoringEnabled: true,
  workforceRiskMonitoringEnabled: true,
  infrastructureRiskMonitoringEnabled: true,
  uncontrolledExpansionDetectionEnabled: true,
  riskRankingEnabled: true,
  recommendationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverSuppressCriticalScalingRisks: true,
  preserveRiskTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveOperationalInformation: true,
  riskProbabilityThreshold: 55,
  highSeverityThreshold: 70,
  criticalSeverityThreshold: 85,
  uncontrolledExpansionThreshold: 75,
  operationalRiskThreshold: 60,
  financialRiskThreshold: 60,
  supplierRiskThreshold: 60,
  marketingRiskThreshold: 60,
  workforceRiskThreshold: 60,
  infrastructureRiskThreshold: 60,
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

export function loadScalingRiskMonitorConfigFile(
  repositoryRoot: string,
): Partial<ScalingRiskMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "scaling-risk-monitor.config.json"),
    join(repositoryRoot, "config", "scaling-risk-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ScalingRiskMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildScalingRiskMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ScalingRiskMonitorConfiguration> = {},
): ScalingRiskMonitorConfiguration {
  const fileConfig = repositoryRoot
    ? loadScalingRiskMonitorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ScalingRiskMonitorConfiguration> = {
    enabled: envBool(
      "SCALING_RISK_MONITOR_ENABLED",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SCALING_RISK_MONITOR_TIMEOUT_MS",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SCALING_RISK_MONITOR_MAX_RETRIES",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.maxRetryAttempts,
    ),
    riskProbabilityThreshold: envInt(
      "SCALING_RISK_MONITOR_PROBABILITY_THRESHOLD",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.riskProbabilityThreshold,
    ),
    highSeverityThreshold: envInt(
      "SCALING_RISK_MONITOR_HIGH_SEVERITY",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.highSeverityThreshold,
    ),
    criticalSeverityThreshold: envInt(
      "SCALING_RISK_MONITOR_CRITICAL_SEVERITY",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.criticalSeverityThreshold,
    ),
    uncontrolledExpansionThreshold: envInt(
      "SCALING_RISK_MONITOR_EXPANSION_THRESHOLD",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.uncontrolledExpansionThreshold,
    ),
    loggingLevel: envString(
      "SCALING_RISK_MONITOR_LOG_LEVEL",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.loggingLevel,
    ) as ScalingRiskMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SCALING_RISK_MONITOR_AUTO_RECOVER",
      DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SCALING_RISK_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverSuppressCriticalScalingRisks: true,
    preserveRiskTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
