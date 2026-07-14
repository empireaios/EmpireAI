/** T1-02 — Externalized UI State Mapper configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SerializationFormat } from "./types.js";

export type UiStateMapperConfiguration = {
  enabled: boolean;
  updateIntervalMs: number;
  maxUpdateRate: number;
  serializationFormat: SerializationFormat;
  gridRows: number;
  gridColumns: number;
  stateBufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  mappingTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateStates: boolean;
};

export const DEFAULT_UI_STATE_MAPPER_CONFIGURATION: UiStateMapperConfiguration = {
  enabled: true,
  updateIntervalMs: 1000,
  maxUpdateRate: 5,
  serializationFormat: "json",
  gridRows: 4,
  gridColumns: 4,
  stateBufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  mappingTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateStates: true,
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

export function loadUiStateMapperConfigFile(
  repositoryRoot: string,
): Partial<UiStateMapperConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ui-state-mapper.config.json"),
    join(repositoryRoot, "config", "ui-state-mapper.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<UiStateMapperConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildUiStateMapperConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UiStateMapperConfiguration> = {},
): UiStateMapperConfiguration {
  const fileConfig = repositoryRoot ? loadUiStateMapperConfigFile(repositoryRoot) : null;
  const envConfig: Partial<UiStateMapperConfiguration> = {
    enabled: envBool("UI_STATE_MAPPER_ENABLED", DEFAULT_UI_STATE_MAPPER_CONFIGURATION.enabled),
    updateIntervalMs: envInt(
      "UI_STATE_MAPPER_INTERVAL_MS",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.updateIntervalMs,
    ),
    maxUpdateRate: envInt(
      "UI_STATE_MAPPER_MAX_RATE",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.maxUpdateRate,
    ),
    serializationFormat: envString(
      "UI_STATE_MAPPER_SERIALIZATION",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.serializationFormat,
    ) as SerializationFormat,
    gridRows: envInt("UI_STATE_MAPPER_GRID_ROWS", DEFAULT_UI_STATE_MAPPER_CONFIGURATION.gridRows),
    gridColumns: envInt(
      "UI_STATE_MAPPER_GRID_COLUMNS",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.gridColumns,
    ),
    stateBufferLimit: envInt(
      "UI_STATE_MAPPER_BUFFER_LIMIT",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.stateBufferLimit,
    ),
    maxRetryAttempts: envInt(
      "UI_STATE_MAPPER_MAX_RETRIES",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "UI_STATE_MAPPER_RETRY_DELAY_MS",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.retryDelayMs,
    ),
    mappingTimeoutMs: envInt(
      "UI_STATE_MAPPER_TIMEOUT_MS",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.mappingTimeoutMs,
    ),
    loggingLevel: envString(
      "UI_STATE_MAPPER_LOG_LEVEL",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.loggingLevel,
    ) as UiStateMapperConfiguration["loggingLevel"],
    autoRecover: envBool(
      "UI_STATE_MAPPER_AUTO_RECOVER",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.autoRecover,
    ),
    validateStates: envBool(
      "UI_STATE_MAPPER_VALIDATE",
      DEFAULT_UI_STATE_MAPPER_CONFIGURATION.validateStates,
    ),
  };

  return {
    ...DEFAULT_UI_STATE_MAPPER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveUpdateIntervalMs(config: UiStateMapperConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxUpdateRate));
  return Math.max(minInterval, config.updateIntervalMs);
}
