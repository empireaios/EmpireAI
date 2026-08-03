/** X2-01 — Externalized Enterprise Portfolio Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type EnterprisePortfolioFrameworkConfiguration = {
  enabled: boolean;
  moduleRegistrationRulesEnabled: boolean;
  portfolioLifecycleRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  eventRoutingRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverBypassValidation: true;
  preservePortfolioIsolation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  maxRegisteredModules: number;
  maxRegisteredCompanies: number;
  defaultEventsPerMinute: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION: EnterprisePortfolioFrameworkConfiguration =
  {
    enabled: true,
    moduleRegistrationRulesEnabled: true,
    portfolioLifecycleRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    eventRoutingRulesEnabled: true,
    neverExposeCredentials: true,
    neverBypassValidation: true,
    preservePortfolioIsolation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    maxRegisteredModules: 50,
    maxRegisteredCompanies: 100,
    defaultEventsPerMinute: 60,
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

export function loadEnterprisePortfolioFrameworkConfigFile(
  repositoryRoot: string,
): Partial<EnterprisePortfolioFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "enterprise-portfolio-framework.config.json"),
    join(repositoryRoot, "config", "enterprise-portfolio-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<EnterprisePortfolioFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildEnterprisePortfolioFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EnterprisePortfolioFrameworkConfiguration> = {},
): EnterprisePortfolioFrameworkConfiguration {
  const fileConfig = repositoryRoot
    ? loadEnterprisePortfolioFrameworkConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<EnterprisePortfolioFrameworkConfiguration> = {
    enabled: envBool(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_ENABLED",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_MAX_RETRIES",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_LOG_LEVEL",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as EnterprisePortfolioFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
    maxRegisteredModules: envInt(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_MAX_MODULES",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.maxRegisteredModules,
    ),
    maxRegisteredCompanies: envInt(
      "ENTERPRISE_PORTFOLIO_FRAMEWORK_MAX_COMPANIES",
      DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION.maxRegisteredCompanies,
    ),
  };

  return {
    ...DEFAULT_ENTERPRISE_PORTFOLIO_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverBypassValidation: true,
    preservePortfolioIsolation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
