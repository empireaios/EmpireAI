/** X1-06 — Externalized Domain & Digital Asset Planner configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type DomainDigitalAssetPlannerConfiguration = {
  enabled: boolean;
  domainPlanningRulesEnabled: boolean;
  namingValidationRulesEnabled: boolean;
  websitePlanningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAutoRegisterOrPurchase: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxPlansPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION: DomainDigitalAssetPlannerConfiguration =
  {
    enabled: true,
    domainPlanningRulesEnabled: true,
    namingValidationRulesEnabled: true,
    websitePlanningRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverAutoRegisterOrPurchase: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxPlansPerCycle: 12,
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

export function loadDomainDigitalAssetPlannerConfigFile(
  repositoryRoot: string,
): Partial<DomainDigitalAssetPlannerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "domain-digital-asset-planner.config.json"),
    join(repositoryRoot, "config", "domain-digital-asset-planner.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<DomainDigitalAssetPlannerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildDomainDigitalAssetPlannerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<DomainDigitalAssetPlannerConfiguration> = {},
): DomainDigitalAssetPlannerConfiguration {
  const fileConfig = repositoryRoot
    ? loadDomainDigitalAssetPlannerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<DomainDigitalAssetPlannerConfiguration> = {
    enabled: envBool(
      "DOMAIN_DIGITAL_ASSET_PLANNER_ENABLED",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "DOMAIN_DIGITAL_ASSET_PLANNER_TIMEOUT_MS",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "DOMAIN_DIGITAL_ASSET_PLANNER_MAX_RETRIES",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "DOMAIN_DIGITAL_ASSET_PLANNER_LOG_LEVEL",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.loggingLevel,
    ) as DomainDigitalAssetPlannerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "DOMAIN_DIGITAL_ASSET_PLANNER_AUTO_RECOVER",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.autoRecover,
    ),
    maxPlansPerCycle: envInt(
      "DOMAIN_DIGITAL_ASSET_PLANNER_MAX_PLANS",
      DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION.maxPlansPerCycle,
    ),
  };

  return {
    ...DEFAULT_DOMAIN_DIGITAL_ASSET_PLANNER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAutoRegisterOrPurchase: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
