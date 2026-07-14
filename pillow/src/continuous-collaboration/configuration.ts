/** T4-09 — Externalized Continuous Collaboration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ContinuousCollaborationConfiguration = {
  enabled: boolean;
  sessionPersistenceRulesEnabled: boolean;
  contextRetentionRulesEnabled: boolean;
  maxActiveDiscussions: number;
  pendingProposalRetentionRulesEnabled: boolean;
  pendingApprovalRetentionRulesEnabled: boolean;
  preferenceApplicationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  collaborationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistorySessions: number;
  maxPendingProposals: number;
  maxPendingApprovals: number;
};

export const DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION: ContinuousCollaborationConfiguration =
  {
    enabled: true,
    sessionPersistenceRulesEnabled: true,
    contextRetentionRulesEnabled: true,
    maxActiveDiscussions: 20,
    pendingProposalRetentionRulesEnabled: true,
    pendingApprovalRetentionRulesEnabled: true,
    preferenceApplicationRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    collaborationTimeoutMs: 120000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistorySessions: 50,
    maxPendingProposals: 30,
    maxPendingApprovals: 20,
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

export function loadContinuousCollaborationConfigFile(
  repositoryRoot: string,
): Partial<ContinuousCollaborationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "continuous-collaboration.config.json"),
    join(repositoryRoot, "config", "continuous-collaboration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ContinuousCollaborationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildContinuousCollaborationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ContinuousCollaborationConfiguration> = {},
): ContinuousCollaborationConfiguration {
  const fileConfig = repositoryRoot
    ? loadContinuousCollaborationConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<ContinuousCollaborationConfiguration> = {
    enabled: envBool(
      "CONTINUOUS_COLLABORATION_ENABLED",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.enabled,
    ),
    maxActiveDiscussions: envInt(
      "CONTINUOUS_COLLABORATION_MAX_DISCUSSIONS",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.maxActiveDiscussions,
    ),
    maxRetryAttempts: envInt(
      "CONTINUOUS_COLLABORATION_MAX_RETRIES",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.maxRetryAttempts,
    ),
    collaborationTimeoutMs: envInt(
      "CONTINUOUS_COLLABORATION_TIMEOUT_MS",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.collaborationTimeoutMs,
    ),
    loggingLevel: envString(
      "CONTINUOUS_COLLABORATION_LOG_LEVEL",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.loggingLevel,
    ) as ContinuousCollaborationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CONTINUOUS_COLLABORATION_AUTO_RECOVER",
      DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CONTINUOUS_COLLABORATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
