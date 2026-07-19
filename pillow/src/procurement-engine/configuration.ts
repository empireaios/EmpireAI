/** R2-09 — Externalized Procurement Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ProcurementEngineConfiguration = {
  enabled: boolean;
  supplierSelectionRulesEnabled: boolean;
  procurementApprovalRulesEnabled: boolean;
  autoApproveBelowCost: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  requireApprovalAboveCost: number;
  maskSensitiveValues: true;
};

export const DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION: ProcurementEngineConfiguration = {
  enabled: true,
  supplierSelectionRulesEnabled: true,
  procurementApprovalRulesEnabled: true,
  autoApproveBelowCost: 50,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveExistingOnValidationFailure: true,
  requireApprovalAboveCost: 100,
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

export function loadProcurementEngineConfigFile(
  repositoryRoot: string,
): Partial<ProcurementEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "procurement-engine.config.json"),
    join(repositoryRoot, "config", "procurement-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ProcurementEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildProcurementEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProcurementEngineConfiguration> = {},
): ProcurementEngineConfiguration {
  const fileConfig = repositoryRoot ? loadProcurementEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ProcurementEngineConfiguration> = {
    enabled: envBool(
      "PROCUREMENT_ENGINE_ENABLED",
      DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION.enabled,
    ),
    autoApproveBelowCost: envInt(
      "PROCUREMENT_ENGINE_AUTO_APPROVE_BELOW",
      DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION.autoApproveBelowCost,
    ),
    loggingLevel: envString(
      "PROCUREMENT_ENGINE_LOG_LEVEL",
      DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as ProcurementEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PROCUREMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PROCUREMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
