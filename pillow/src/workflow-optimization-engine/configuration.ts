/** T2-05 — Externalized Workflow Optimization configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FRICTION_CATEGORIES } from "./paths.js";
import type { FrictionCategory } from "./types.js";

export type WorkflowOptimizationConfiguration = {
  enabled: boolean;
  analysisFrequency: "on_demand" | "continuous" | "scheduled";
  frictionCategories: FrictionCategory[];
  stepThreshold: number;
  repetitionThreshold: number;
  navigationFrictionEnabled: boolean;
  formFrictionEnabled: boolean;
  waitingStateRulesEnabled: boolean;
  severityRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  analysisTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION: WorkflowOptimizationConfiguration = {
  enabled: true,
  analysisFrequency: "on_demand",
  frictionCategories: [...FRICTION_CATEGORIES],
  stepThreshold: 5,
  repetitionThreshold: 3,
  navigationFrictionEnabled: true,
  formFrictionEnabled: true,
  waitingStateRulesEnabled: true,
  severityRulesEnabled: true,
  confidenceThreshold: 0.4,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  analysisTimeoutMs: 60000,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadWorkflowOptimizationConfigFile(
  repositoryRoot: string,
): Partial<WorkflowOptimizationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "workflow-optimization.config.json"),
    join(repositoryRoot, "config", "workflow-optimization.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<WorkflowOptimizationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWorkflowOptimizationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkflowOptimizationConfiguration> = {},
): WorkflowOptimizationConfiguration {
  const fileConfig = repositoryRoot ? loadWorkflowOptimizationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<WorkflowOptimizationConfiguration> = {
    enabled: envBool(
      "WORKFLOW_OPTIMIZATION_ENABLED",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.enabled,
    ),
    stepThreshold: envInt(
      "WORKFLOW_OPTIMIZATION_STEP_THRESHOLD",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.stepThreshold,
    ),
    repetitionThreshold: envInt(
      "WORKFLOW_OPTIMIZATION_REPETITION_THRESHOLD",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.repetitionThreshold,
    ),
    confidenceThreshold: envFloat(
      "WORKFLOW_OPTIMIZATION_CONFIDENCE_THRESHOLD",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "WORKFLOW_OPTIMIZATION_MAX_RETRIES",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.maxRetryAttempts,
    ),
    analysisTimeoutMs: envInt(
      "WORKFLOW_OPTIMIZATION_TIMEOUT_MS",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.analysisTimeoutMs,
    ),
    loggingLevel: envString(
      "WORKFLOW_OPTIMIZATION_LOG_LEVEL",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.loggingLevel,
    ) as WorkflowOptimizationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WORKFLOW_OPTIMIZATION_AUTO_RECOVER",
      DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WORKFLOW_OPTIMIZATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
