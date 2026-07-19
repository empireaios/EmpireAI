/** X1-01 — Externalized Company Factory Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CompanyFactoryFrameworkConfiguration = {
  enabled: boolean;
  moduleRegistrationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  eventRoutingRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  apiTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  defaultEventsPerMinute: number;
  defaultBurstLimit: number;
  rateLimitWindowMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maxRegisteredModules: number;
  isolateModules: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION: CompanyFactoryFrameworkConfiguration = {
  enabled: true,
  moduleRegistrationRulesEnabled: true,
  validationRulesEnabled: true,
  eventRoutingRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  apiTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  retryBackoffMultiplier: 2,
  rateLimitEnabled: true,
  defaultEventsPerMinute: 60,
  defaultBurstLimit: 10,
  rateLimitWindowMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  maxRegisteredModules: 50,
  isolateModules: true,
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

export function loadCompanyFactoryFrameworkConfigFile(
  repositoryRoot: string,
): Partial<CompanyFactoryFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "company-factory-framework.config.json"),
    join(repositoryRoot, "config", "company-factory-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CompanyFactoryFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCompanyFactoryFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CompanyFactoryFrameworkConfiguration> = {},
): CompanyFactoryFrameworkConfiguration {
  const fileConfig = repositoryRoot ? loadCompanyFactoryFrameworkConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CompanyFactoryFrameworkConfiguration> = {
    enabled: envBool(
      "COMPANY_FACTORY_FRAMEWORK_ENABLED",
      DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION.enabled,
    ),
    apiTimeoutMs: envInt(
      "COMPANY_FACTORY_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION.apiTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "COMPANY_FACTORY_FRAMEWORK_MAX_RETRIES",
      DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "COMPANY_FACTORY_FRAMEWORK_LOG_LEVEL",
      DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as CompanyFactoryFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPANY_FACTORY_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_COMPANY_FACTORY_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
