/** R2-10 — Externalized Fulfilment Orchestrator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FulfilmentOrchestratorConfiguration = {
  enabled: boolean;
  fulfilmentRoutingRulesEnabled: boolean;
  supplierRouteSelectionRulesEnabled: boolean;
  workflowRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  requireApprovedProcurement: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION: FulfilmentOrchestratorConfiguration =
  {
    enabled: true,
    fulfilmentRoutingRulesEnabled: true,
    supplierRouteSelectionRulesEnabled: true,
    workflowRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
    requireApprovedProcurement: true,
    maskSensitiveValues: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadFulfilmentOrchestratorConfigFile(
  repositoryRoot: string,
): Partial<FulfilmentOrchestratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "fulfilment-orchestrator.config.json"),
    join(repositoryRoot, "config", "fulfilment-orchestrator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<FulfilmentOrchestratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFulfilmentOrchestratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FulfilmentOrchestratorConfiguration> = {},
): FulfilmentOrchestratorConfiguration {
  const fileConfig = repositoryRoot ? loadFulfilmentOrchestratorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<FulfilmentOrchestratorConfiguration> = {
    enabled: envBool(
      "FULFILMENT_ORCHESTRATOR_ENABLED",
      DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION.enabled,
    ),
    loggingLevel: envString(
      "FULFILMENT_ORCHESTRATOR_LOG_LEVEL",
      DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION.loggingLevel,
    ) as FulfilmentOrchestratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FULFILMENT_ORCHESTRATOR_AUTO_RECOVER",
      DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FULFILMENT_ORCHESTRATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
