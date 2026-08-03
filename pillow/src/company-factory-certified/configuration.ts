/** X1-15 — Externalized Company Factory Certified configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CERTIFIED_MODULE_IDS } from "./paths.js";

export type CompanyFactoryCertifiedConfiguration = {
  enabled: boolean;
  certificationScope: string[];
  requiredValidationRulesEnabled: boolean;
  passThresholdPercent: number;
  validationRulesEnabled: boolean;
  endToEndValidationEnabled: boolean;
  safeTestMode: true;
  neverExposeCredentials: true;
  neverModifyProductionSystemsUnlessSafeTestMode: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxCertificationsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION: CompanyFactoryCertifiedConfiguration =
  {
    enabled: true,
    certificationScope: [...CERTIFIED_MODULE_IDS],
    requiredValidationRulesEnabled: true,
    passThresholdPercent: 85,
    validationRulesEnabled: true,
    endToEndValidationEnabled: true,
    safeTestMode: true,
    neverExposeCredentials: true,
    neverModifyProductionSystemsUnlessSafeTestMode: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxCertificationsPerCycle: 6,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
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

export function loadCompanyFactoryCertifiedConfigFile(
  repositoryRoot: string,
): Partial<CompanyFactoryCertifiedConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "company-factory-certified.config.json"),
    join(repositoryRoot, "config", "company-factory-certified.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CompanyFactoryCertifiedConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCompanyFactoryCertifiedConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CompanyFactoryCertifiedConfiguration> = {},
): CompanyFactoryCertifiedConfiguration {
  const fileConfig = repositoryRoot
    ? loadCompanyFactoryCertifiedConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CompanyFactoryCertifiedConfiguration> = {
    enabled: envBool(
      "COMPANY_FACTORY_CERTIFIED_ENABLED",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "COMPANY_FACTORY_CERTIFIED_PASS_THRESHOLD",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.passThresholdPercent,
    ),
    connectionTimeoutMs: envInt(
      "COMPANY_FACTORY_CERTIFIED_TIMEOUT_MS",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "COMPANY_FACTORY_CERTIFIED_MAX_RETRIES",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "COMPANY_FACTORY_CERTIFIED_LOG_LEVEL",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.loggingLevel,
    ) as CompanyFactoryCertifiedConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPANY_FACTORY_CERTIFIED_AUTO_RECOVER",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.autoRecover,
    ),
    maxCertificationsPerCycle: envInt(
      "COMPANY_FACTORY_CERTIFIED_MAX_CERTIFICATIONS",
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.maxCertificationsPerCycle,
    ),
  };

  return {
    ...DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    certificationScope:
      overrides.certificationScope ??
      fileConfig?.certificationScope ??
      DEFAULT_COMPANY_FACTORY_CERTIFIED_CONFIGURATION.certificationScope,
    safeTestMode: true,
    neverExposeCredentials: true,
    neverModifyProductionSystemsUnlessSafeTestMode: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
