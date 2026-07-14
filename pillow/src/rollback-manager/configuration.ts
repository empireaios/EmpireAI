/** T3-08 — Externalized Rollback Manager configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROLLBACK_SCOPES, ROLLBACK_TRIGGERS } from "./paths.js";
import type { RollbackScope, RollbackTrigger } from "./types.js";

export type RollbackManagerConfiguration = {
  enabled: boolean;
  restorePointRulesEnabled: boolean;
  snapshotRetentionMs: number;
  maxRestorePoints: number;
  rollbackTriggerRules: RollbackTrigger[];
  rollbackVerificationEnabled: boolean;
  protectedFiles: string[];
  allowedRollbackScopes: RollbackScope[];
  cleanupExpiredSnapshots: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  rollbackTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  autoCreateRestorePoints: boolean;
};

export const DEFAULT_ROLLBACK_MANAGER_CONFIGURATION: RollbackManagerConfiguration = {
  enabled: true,
  restorePointRulesEnabled: true,
  snapshotRetentionMs: 86400000,
  maxRestorePoints: 50,
  rollbackTriggerRules: [...ROLLBACK_TRIGGERS],
  rollbackVerificationEnabled: true,
  protectedFiles: [
    "package.json",
    "tsconfig.json",
    ".env",
    ".env.local",
    "next.config.ts",
    "next.config.js",
  ],
  allowedRollbackScopes: [...ROLLBACK_SCOPES],
  cleanupExpiredSnapshots: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  rollbackTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  outputValidationEnabled: true,
  autoCreateRestorePoints: true,
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

export function loadRollbackManagerConfigFile(
  repositoryRoot: string,
): Partial<RollbackManagerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "rollback-manager.config.json"),
    join(repositoryRoot, "config", "rollback-manager.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<RollbackManagerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRollbackManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RollbackManagerConfiguration> = {},
): RollbackManagerConfiguration {
  const fileConfig = repositoryRoot ? loadRollbackManagerConfigFile(repositoryRoot) : null;
  const envConfig: Partial<RollbackManagerConfiguration> = {
    enabled: envBool("ROLLBACK_MANAGER_ENABLED", DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.enabled),
    snapshotRetentionMs: envInt(
      "ROLLBACK_MANAGER_RETENTION_MS",
      DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.snapshotRetentionMs,
    ),
    maxRetryAttempts: envInt(
      "ROLLBACK_MANAGER_MAX_RETRIES",
      DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.maxRetryAttempts,
    ),
    rollbackTimeoutMs: envInt(
      "ROLLBACK_MANAGER_TIMEOUT_MS",
      DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.rollbackTimeoutMs,
    ),
    loggingLevel: envString(
      "ROLLBACK_MANAGER_LOG_LEVEL",
      DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.loggingLevel,
    ) as RollbackManagerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ROLLBACK_MANAGER_AUTO_RECOVER",
      DEFAULT_ROLLBACK_MANAGER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ROLLBACK_MANAGER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
