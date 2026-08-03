/** X3-10 — Externalized Bottleneck Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BottleneckIntelligenceConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  operationalMonitoringEnabled: boolean;
  infrastructureMonitoringEnabled: boolean;
  supplierMonitoringEnabled: boolean;
  marketingMonitoringEnabled: boolean;
  financialMonitoringEnabled: boolean;
  workforceMonitoringEnabled: boolean;
  throughputConstraintDetectionEnabled: boolean;
  impactRankingEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverGenerateUnsupportedBottleneckConclusions: true;
  preserveBottleneckTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  severityThreshold: number;
  impactThreshold: number;
  throughputConstraintThreshold: number;
  highSeverityThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION: BottleneckIntelligenceConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    operationalMonitoringEnabled: true,
    infrastructureMonitoringEnabled: true,
    supplierMonitoringEnabled: true,
    marketingMonitoringEnabled: true,
    financialMonitoringEnabled: true,
    workforceMonitoringEnabled: true,
    throughputConstraintDetectionEnabled: true,
    impactRankingEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverGenerateUnsupportedBottleneckConclusions: true,
    preserveBottleneckTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    severityThreshold: 45,
    impactThreshold: 45,
    throughputConstraintThreshold: 45,
    highSeverityThreshold: 70,
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

export function loadBottleneckIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<BottleneckIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "bottleneck-intelligence.config.json"),
    join(repositoryRoot, "config", "bottleneck-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BottleneckIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBottleneckIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BottleneckIntelligenceConfiguration> = {},
): BottleneckIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadBottleneckIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BottleneckIntelligenceConfiguration> = {
    enabled: envBool(
      "BOTTLENECK_INTELLIGENCE_ENABLED",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BOTTLENECK_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BOTTLENECK_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    severityThreshold: envInt(
      "BOTTLENECK_INTELLIGENCE_SEVERITY_THRESHOLD",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.severityThreshold,
    ),
    impactThreshold: envInt(
      "BOTTLENECK_INTELLIGENCE_IMPACT_THRESHOLD",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.impactThreshold,
    ),
    throughputConstraintThreshold: envInt(
      "BOTTLENECK_INTELLIGENCE_THROUGHPUT_THRESHOLD",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.throughputConstraintThreshold,
    ),
    highSeverityThreshold: envInt(
      "BOTTLENECK_INTELLIGENCE_HIGH_SEVERITY",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.highSeverityThreshold,
    ),
    loggingLevel: envString(
      "BOTTLENECK_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as BottleneckIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BOTTLENECK_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_BOTTLENECK_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverGenerateUnsupportedBottleneckConclusions: true,
    preserveBottleneckTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
