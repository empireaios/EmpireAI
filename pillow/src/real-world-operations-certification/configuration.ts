/** R5-20 — Externalized Real World Operations Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RealWorldOperationsCertificationConfiguration = {
  enabled: boolean;
  certificationScope:
    | "full"
    | "marketplace"
    | "supplier"
    | "financial"
    | "customer"
    | "marketing"
    | "integration";
  requiredValidationRulesEnabled: boolean;
  operationalReadinessThreshold: number;
  passThresholdPercent: number;
  failureDetectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  safeTestMode: true;
  neverModifyProductionOperationsUnlessSafeTestMode: true;
  maskSensitiveValues: true;
};

export const DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION: RealWorldOperationsCertificationConfiguration =
  {
    enabled: true,
    certificationScope: "full",
    requiredValidationRulesEnabled: true,
    operationalReadinessThreshold: 80,
    passThresholdPercent: 85,
    failureDetectionRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 180000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    safeTestMode: true,
    neverModifyProductionOperationsUnlessSafeTestMode: true,
    maskSensitiveValues: true,
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

export function loadRealWorldOperationsCertificationConfigFile(
  repositoryRoot: string,
): Partial<RealWorldOperationsCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "real-world-operations-certification.config.json"),
    join(repositoryRoot, "config", "real-world-operations-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<RealWorldOperationsCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRealWorldOperationsCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RealWorldOperationsCertificationConfiguration> = {},
): RealWorldOperationsCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadRealWorldOperationsCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<RealWorldOperationsCertificationConfiguration> = {
    enabled: envBool(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_ENABLED",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.passThresholdPercent,
    ),
    operationalReadinessThreshold: envInt(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_READINESS_THRESHOLD",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.operationalReadinessThreshold,
    ),
    loggingLevel: envString(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_LOG_LEVEL",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as RealWorldOperationsCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
    requestTimeoutMs: envInt(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REAL_WORLD_OPERATIONS_CERTIFICATION_MAX_RETRIES",
      DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
  };

  return {
    ...DEFAULT_REAL_WORLD_OPERATIONS_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
    safeTestMode: true,
    neverModifyProductionOperationsUnlessSafeTestMode: true,
  };
}
