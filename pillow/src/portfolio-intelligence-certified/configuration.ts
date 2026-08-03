/** X2-10 — Externalized Portfolio Intelligence Certified configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CERTIFIED_MODULE_IDS } from "./paths.js";

export type PortfolioIntelligenceCertifiedConfiguration = {
  enabled: boolean;
  certificationScope: string[];
  requiredValidationRulesEnabled: boolean;
  passThresholdPercent: number;
  validationRulesEnabled: boolean;
  endToEndValidationEnabled: boolean;
  safeTestMode: true;
  neverExposeCredentials: true;
  neverModifyProductionSystemsUnlessSafeTestMode: true;
  preserveOperationalTraceability: true;
  preserveAuditability: true;
  preserveCertificationIntegrity: true;
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

export const DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION: PortfolioIntelligenceCertifiedConfiguration =
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
    preserveOperationalTraceability: true,
    preserveAuditability: true,
    preserveCertificationIntegrity: true,
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

export function loadPortfolioIntelligenceCertifiedConfigFile(
  repositoryRoot: string,
): Partial<PortfolioIntelligenceCertifiedConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-intelligence-certified.config.json"),
    join(repositoryRoot, "config", "portfolio-intelligence-certified.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioIntelligenceCertifiedConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioIntelligenceCertifiedConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioIntelligenceCertifiedConfiguration> = {},
): PortfolioIntelligenceCertifiedConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioIntelligenceCertifiedConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioIntelligenceCertifiedConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_ENABLED",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_PASS_THRESHOLD",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.passThresholdPercent,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_MAX_RETRIES",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_LOG_LEVEL",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.loggingLevel,
    ) as PortfolioIntelligenceCertifiedConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_INTELLIGENCE_CERTIFIED_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    certificationScope:
      overrides.certificationScope ??
      fileConfig?.certificationScope ??
      DEFAULT_PORTFOLIO_INTELLIGENCE_CERTIFIED_CONFIGURATION.certificationScope,
    safeTestMode: true,
    neverExposeCredentials: true,
    neverModifyProductionSystemsUnlessSafeTestMode: true,
    preserveOperationalTraceability: true,
    preserveAuditability: true,
    preserveCertificationIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
