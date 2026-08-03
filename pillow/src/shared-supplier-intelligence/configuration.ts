/** X2-13 — Externalized Shared Supplier Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SharedSupplierIntelligenceConfiguration = {
  enabled: boolean;
  supplierEvaluationRulesEnabled: boolean;
  supplierSharingRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeConfidentialSupplierAgreements: true;
  preserveSupplierTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveSupplierInformation: true;
  optimalPerformanceThreshold: number;
  reliabilityThreshold: number;
  costCompetitivenessThreshold: number;
  riskScoreThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION: SharedSupplierIntelligenceConfiguration =
  {
    enabled: true,
    supplierEvaluationRulesEnabled: true,
    supplierSharingRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeConfidentialSupplierAgreements: true,
    preserveSupplierTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveSupplierInformation: true,
    optimalPerformanceThreshold: 70,
    reliabilityThreshold: 65,
    costCompetitivenessThreshold: 60,
    riskScoreThreshold: 65,
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

export function loadSharedSupplierIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<SharedSupplierIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "shared-supplier-intelligence.config.json"),
    join(repositoryRoot, "config", "shared-supplier-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SharedSupplierIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSharedSupplierIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SharedSupplierIntelligenceConfiguration> = {},
): SharedSupplierIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadSharedSupplierIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<SharedSupplierIntelligenceConfiguration> = {
    enabled: envBool(
      "SHARED_SUPPLIER_INTELLIGENCE_ENABLED",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SHARED_SUPPLIER_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SHARED_SUPPLIER_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    optimalPerformanceThreshold: envInt(
      "SHARED_SUPPLIER_INTELLIGENCE_OPTIMAL_THRESHOLD",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.optimalPerformanceThreshold,
    ),
    loggingLevel: envString(
      "SHARED_SUPPLIER_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as SharedSupplierIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SHARED_SUPPLIER_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SHARED_SUPPLIER_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeConfidentialSupplierAgreements: true,
    preserveSupplierTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveSupplierInformation: true,
  };
}
