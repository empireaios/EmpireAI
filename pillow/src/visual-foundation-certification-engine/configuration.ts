/** T1-10 — Externalized Visual Foundation Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { T1_MISSION_IDS } from "./paths.js";
import type { T1MissionId } from "./types.js";

export type VisualFoundationCertificationConfiguration = {
  enabled: boolean;
  validationScope: T1MissionId[];
  testSessionDurationMs: number;
  requiredPassThreshold: number;
  requireEndToEndPass: boolean;
  reportOutputRoot: string;
  maxRetryAttempts: number;
  retryDelayMs: number;
  certificationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateSensitiveDataProtection: boolean;
  validateHealthReporting: boolean;
  validateRecoveryBehavior: boolean;
};

export const DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION: VisualFoundationCertificationConfiguration =
  {
    enabled: true,
    validationScope: [...T1_MISSION_IDS],
    testSessionDurationMs: 30000,
    requiredPassThreshold: 50,
    requireEndToEndPass: true,
    reportOutputRoot: ".pillow-visual-foundation-certification",
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    certificationTimeoutMs: 120000,
    loggingLevel: "info",
    autoRecover: true,
    validateSensitiveDataProtection: true,
    validateHealthReporting: true,
    validateRecoveryBehavior: true,
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

export function loadVisualFoundationCertificationConfigFile(
  repositoryRoot: string,
): Partial<VisualFoundationCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "visual-foundation-certification.config.json"),
    join(repositoryRoot, "config", "visual-foundation-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<VisualFoundationCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVisualFoundationCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualFoundationCertificationConfiguration> = {},
): VisualFoundationCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadVisualFoundationCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<VisualFoundationCertificationConfiguration> = {
    enabled: envBool(
      "VISUAL_FOUNDATION_CERTIFICATION_ENABLED",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.enabled,
    ),
    requiredPassThreshold: envFloat(
      "VISUAL_FOUNDATION_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.requiredPassThreshold,
    ),
    requireEndToEndPass: envBool(
      "VISUAL_FOUNDATION_CERTIFICATION_REQUIRE_E2E",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.requireEndToEndPass,
    ),
    reportOutputRoot: envString(
      "VISUAL_FOUNDATION_CERTIFICATION_REPORT_ROOT",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.reportOutputRoot,
    ),
    maxRetryAttempts: envInt(
      "VISUAL_FOUNDATION_CERTIFICATION_MAX_RETRIES",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    certificationTimeoutMs: envInt(
      "VISUAL_FOUNDATION_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.certificationTimeoutMs,
    ),
    loggingLevel: envString(
      "VISUAL_FOUNDATION_CERTIFICATION_LOG_LEVEL",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as VisualFoundationCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VISUAL_FOUNDATION_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_VISUAL_FOUNDATION_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
