/** T1-01 — Externalized Visual Capture configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CAPTURE_URL, DEFAULT_WINDOW_TITLE_PATTERNS } from "./paths.js";
import type { CaptureSource } from "./types.js";

export type VisualCaptureConfiguration = {
  enabled: boolean;
  captureIntervalMs: number;
  maxFrameRate: number;
  captureSource: CaptureSource;
  captureUrl: string;
  windowTitlePatterns: string[];
  selectedWindowId: string | null;
  selectedDisplayId: string | null;
  bufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  captureTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_VISUAL_CAPTURE_CONFIGURATION: VisualCaptureConfiguration = {
  enabled: true,
  captureIntervalMs: 1000,
  maxFrameRate: 5,
  captureSource: "browser_viewport",
  captureUrl: DEFAULT_CAPTURE_URL,
  windowTitlePatterns: [...DEFAULT_WINDOW_TITLE_PATTERNS],
  selectedWindowId: null,
  selectedDisplayId: null,
  bufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  captureTimeoutMs: 15000,
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

export function loadVisualCaptureConfigFile(repositoryRoot: string): Partial<VisualCaptureConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "visual-capture.config.json"),
    join(repositoryRoot, "config", "visual-capture.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<VisualCaptureConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVisualCaptureConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualCaptureConfiguration> = {},
): VisualCaptureConfiguration {
  const fileConfig = repositoryRoot ? loadVisualCaptureConfigFile(repositoryRoot) : null;
  const envConfig: Partial<VisualCaptureConfiguration> = {
    enabled: envBool("VISUAL_CAPTURE_ENABLED", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.enabled),
    captureIntervalMs: envInt("VISUAL_CAPTURE_INTERVAL_MS", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.captureIntervalMs),
    maxFrameRate: envInt("VISUAL_CAPTURE_MAX_FPS", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.maxFrameRate),
    captureSource: envString("VISUAL_CAPTURE_SOURCE", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.captureSource) as CaptureSource,
    captureUrl: envString("VISUAL_CAPTURE_URL", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.captureUrl),
    bufferLimit: envInt("VISUAL_CAPTURE_BUFFER_LIMIT", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.bufferLimit),
    maxRetryAttempts: envInt("VISUAL_CAPTURE_MAX_RETRIES", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.maxRetryAttempts),
    retryDelayMs: envInt("VISUAL_CAPTURE_RETRY_DELAY_MS", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.retryDelayMs),
    captureTimeoutMs: envInt("VISUAL_CAPTURE_TIMEOUT_MS", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.captureTimeoutMs),
    loggingLevel: envString("VISUAL_CAPTURE_LOG_LEVEL", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.loggingLevel) as VisualCaptureConfiguration["loggingLevel"],
    autoRecover: envBool("VISUAL_CAPTURE_AUTO_RECOVER", DEFAULT_VISUAL_CAPTURE_CONFIGURATION.autoRecover),
  };

  const patterns = process.env.VISUAL_CAPTURE_WINDOW_PATTERNS;
  if (patterns) {
    envConfig.windowTitlePatterns = patterns.split(",").map((p) => p.trim()).filter(Boolean);
  }

  return {
    ...DEFAULT_VISUAL_CAPTURE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveCaptureIntervalMs(config: VisualCaptureConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxFrameRate));
  return Math.max(minInterval, config.captureIntervalMs);
}
