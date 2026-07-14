/** T1-08 — Externalized Visual Memory configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { STORAGE_BACKENDS } from "./paths.js";

export type StorageBackend = (typeof STORAGE_BACKENDS)[number];

export type VisualMemoryConfiguration = {
  enabled: boolean;
  storageBackend: StorageBackend;
  storageRoot: string;
  memoryCaptureIntervalMs: number;
  maxCaptureRate: number;
  retentionDurationMs: number;
  snapshotRetentionDurationMs: number;
  maxStorageSizeBytes: number;
  maxRecords: number;
  retrievalLimit: number;
  storeSnapshots: boolean;
  maskSensitiveValues: boolean;
  sensitiveFieldPatterns: string[];
  compressRecords: boolean;
  cleanupIntervalMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  storageTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateRecords: boolean;
};

export const SENSITIVE_FIELD_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "auth",
  "credential",
  "payment",
  "card",
  "cvv",
  "ssn",
  "social_security",
];

export const DEFAULT_VISUAL_MEMORY_CONFIGURATION: VisualMemoryConfiguration = {
  enabled: true,
  storageBackend: "file",
  storageRoot: ".pillow-visual-memory",
  memoryCaptureIntervalMs: 2000,
  maxCaptureRate: 3,
  retentionDurationMs: 7 * 24 * 60 * 60 * 1000,
  snapshotRetentionDurationMs: 24 * 60 * 60 * 1000,
  maxStorageSizeBytes: 50 * 1024 * 1024,
  maxRecords: 5000,
  retrievalLimit: 100,
  storeSnapshots: true,
  maskSensitiveValues: true,
  sensitiveFieldPatterns: [...SENSITIVE_FIELD_PATTERNS],
  compressRecords: false,
  cleanupIntervalMs: 60 * 60 * 1000,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  storageTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateRecords: true,
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

export function loadVisualMemoryConfigFile(
  repositoryRoot: string,
): Partial<VisualMemoryConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "visual-memory.config.json"),
    join(repositoryRoot, "config", "visual-memory.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<VisualMemoryConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVisualMemoryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualMemoryConfiguration> = {},
): VisualMemoryConfiguration {
  const fileConfig = repositoryRoot ? loadVisualMemoryConfigFile(repositoryRoot) : null;
  const envConfig: Partial<VisualMemoryConfiguration> = {
    enabled: envBool("VISUAL_MEMORY_ENABLED", DEFAULT_VISUAL_MEMORY_CONFIGURATION.enabled),
    storageBackend: envString(
      "VISUAL_MEMORY_STORAGE_BACKEND",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.storageBackend,
    ) as StorageBackend,
    storageRoot: envString(
      "VISUAL_MEMORY_STORAGE_ROOT",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.storageRoot,
    ),
    memoryCaptureIntervalMs: envInt(
      "VISUAL_MEMORY_INTERVAL_MS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.memoryCaptureIntervalMs,
    ),
    maxCaptureRate: envInt(
      "VISUAL_MEMORY_MAX_RATE",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.maxCaptureRate,
    ),
    retentionDurationMs: envInt(
      "VISUAL_MEMORY_RETENTION_MS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.retentionDurationMs,
    ),
    maxStorageSizeBytes: envInt(
      "VISUAL_MEMORY_MAX_SIZE_BYTES",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.maxStorageSizeBytes,
    ),
    maxRecords: envInt(
      "VISUAL_MEMORY_MAX_RECORDS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.maxRecords,
    ),
    retrievalLimit: envInt(
      "VISUAL_MEMORY_RETRIEVAL_LIMIT",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.retrievalLimit,
    ),
    storeSnapshots: envBool(
      "VISUAL_MEMORY_STORE_SNAPSHOTS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.storeSnapshots,
    ),
    maskSensitiveValues: envBool(
      "VISUAL_MEMORY_MASK_SENSITIVE",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.maskSensitiveValues,
    ),
    maxRetryAttempts: envInt(
      "VISUAL_MEMORY_MAX_RETRIES",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "VISUAL_MEMORY_RETRY_DELAY_MS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.retryDelayMs,
    ),
    storageTimeoutMs: envInt(
      "VISUAL_MEMORY_TIMEOUT_MS",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.storageTimeoutMs,
    ),
    loggingLevel: envString(
      "VISUAL_MEMORY_LOG_LEVEL",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.loggingLevel,
    ) as VisualMemoryConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VISUAL_MEMORY_AUTO_RECOVER",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.autoRecover,
    ),
    validateRecords: envBool(
      "VISUAL_MEMORY_VALIDATE",
      DEFAULT_VISUAL_MEMORY_CONFIGURATION.validateRecords,
    ),
  };

  return {
    ...DEFAULT_VISUAL_MEMORY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveMemoryCaptureIntervalMs(config: VisualMemoryConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxCaptureRate));
  return Math.max(minInterval, config.memoryCaptureIntervalMs);
}
