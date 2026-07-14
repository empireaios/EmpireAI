/** T5-08 — Externalized Executive Workspace Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExecutiveWorkspaceIntelligenceConfiguration = {
  enabled: boolean;
  continuousOptimizationEnabled: boolean;
  workspaceOptimizationFrequencyMs: number;
  dashboardRecommendationRulesEnabled: boolean;
  workspaceOrganizationRulesEnabled: boolean;
  widgetRecommendationRulesEnabled: boolean;
  shortcutRecommendationRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  optimizationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryOptimizationCycles: number;
  deduplicateRecommendations: boolean;
  recommendOnlyMode: boolean;
};

export const DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION: ExecutiveWorkspaceIntelligenceConfiguration =
  {
    enabled: true,
    continuousOptimizationEnabled: true,
    workspaceOptimizationFrequencyMs: 20000,
    dashboardRecommendationRulesEnabled: true,
    workspaceOrganizationRulesEnabled: true,
    widgetRecommendationRulesEnabled: true,
    shortcutRecommendationRulesEnabled: true,
    confidenceThreshold: 0.45,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    optimizationTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryOptimizationCycles: 120,
    deduplicateRecommendations: true,
    recommendOnlyMode: true,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadExecutiveWorkspaceIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveWorkspaceIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-workspace-intelligence.config.json"),
    join(repositoryRoot, "config", "executive-workspace-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveWorkspaceIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveWorkspaceIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveWorkspaceIntelligenceConfiguration> = {},
): ExecutiveWorkspaceIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveWorkspaceIntelligenceConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<ExecutiveWorkspaceIntelligenceConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_ENABLED",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    continuousOptimizationEnabled: envBool(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_CONTINUOUS",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.continuousOptimizationEnabled,
    ),
    workspaceOptimizationFrequencyMs: envInt(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_FREQUENCY_MS",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.workspaceOptimizationFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIDENCE_THRESHOLD",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    optimizationTimeoutMs: envInt(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.optimizationTimeoutMs,
    ),
    loggingLevel: envString(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as ExecutiveWorkspaceIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_WORKSPACE_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_WORKSPACE_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    recommendOnlyMode: true,
  };
}
