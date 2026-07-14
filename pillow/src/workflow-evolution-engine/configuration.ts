/** T5-05 — Externalized Workflow Evolution configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WorkflowEvolutionConfiguration = {
  enabled: boolean;
  continuousEvolutionEnabled: boolean;
  analysisFrequencyMs: number;
  frictionDetectionRulesEnabled: boolean;
  prioritizationRulesEnabled: boolean;
  productivityScoringRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  analysisTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryEvolutionCycles: number;
  deduplicateRecommendations: boolean;
  recommendOnlyMode: boolean;
};

export const DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION: WorkflowEvolutionConfiguration = {
  enabled: true,
  continuousEvolutionEnabled: true,
  analysisFrequencyMs: 12000,
  frictionDetectionRulesEnabled: true,
  prioritizationRulesEnabled: true,
  productivityScoringRulesEnabled: true,
  confidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  analysisTimeoutMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  outputValidationEnabled: true,
  maxHistoryEvolutionCycles: 120,
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

export function loadWorkflowEvolutionConfigFile(
  repositoryRoot: string,
): Partial<WorkflowEvolutionConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "workflow-evolution.config.json"),
    join(repositoryRoot, "config", "workflow-evolution.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<WorkflowEvolutionConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWorkflowEvolutionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkflowEvolutionConfiguration> = {},
): WorkflowEvolutionConfiguration {
  const fileConfig = repositoryRoot
    ? loadWorkflowEvolutionConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<WorkflowEvolutionConfiguration> = {
    enabled: envBool(
      "WORKFLOW_EVOLUTION_ENABLED",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.enabled,
    ),
    continuousEvolutionEnabled: envBool(
      "WORKFLOW_EVOLUTION_CONTINUOUS",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.continuousEvolutionEnabled,
    ),
    analysisFrequencyMs: envInt(
      "WORKFLOW_EVOLUTION_FREQUENCY_MS",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.analysisFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "WORKFLOW_EVOLUTION_CONFIDENCE_THRESHOLD",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "WORKFLOW_EVOLUTION_MAX_RETRIES",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.maxRetryAttempts,
    ),
    analysisTimeoutMs: envInt(
      "WORKFLOW_EVOLUTION_TIMEOUT_MS",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.analysisTimeoutMs,
    ),
    loggingLevel: envString(
      "WORKFLOW_EVOLUTION_LOG_LEVEL",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.loggingLevel,
    ) as WorkflowEvolutionConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WORKFLOW_EVOLUTION_AUTO_RECOVER",
      DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WORKFLOW_EVOLUTION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    recommendOnlyMode: true,
  };
}
