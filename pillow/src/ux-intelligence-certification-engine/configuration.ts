/** T2-10 — Externalized UX Intelligence Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { T2_MISSION_IDS } from "./paths.js";
import type { T2MissionId } from "./types.js";

export type UxIntelligenceCertificationConfiguration = {
  enabled: boolean;
  validationScope: T2MissionId[];
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
  requireT1FoundationCertified: boolean;
};

export const DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION: UxIntelligenceCertificationConfiguration =
  {
    enabled: true,
    validationScope: [...T2_MISSION_IDS],
    testSessionDurationMs: 60000,
    requiredPassThreshold: 50,
    requireEndToEndPass: true,
    reportOutputRoot: ".pillow-ux-intelligence-certification",
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    certificationTimeoutMs: 180000,
    loggingLevel: "info",
    autoRecover: true,
    validateSensitiveDataProtection: true,
    validateHealthReporting: true,
    validateRecoveryBehavior: true,
    requireT1FoundationCertified: false,
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

export function loadUxIntelligenceCertificationConfigFile(
  repositoryRoot: string,
): Partial<UxIntelligenceCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ux-intelligence-certification.config.json"),
    join(repositoryRoot, "config", "ux-intelligence-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<UxIntelligenceCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildUxIntelligenceCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UxIntelligenceCertificationConfiguration> = {},
): UxIntelligenceCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadUxIntelligenceCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<UxIntelligenceCertificationConfiguration> = {
    enabled: envBool(
      "UX_INTELLIGENCE_CERTIFICATION_ENABLED",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.enabled,
    ),
    requiredPassThreshold: envFloat(
      "UX_INTELLIGENCE_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.requiredPassThreshold,
    ),
    requireEndToEndPass: envBool(
      "UX_INTELLIGENCE_CERTIFICATION_REQUIRE_E2E",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.requireEndToEndPass,
    ),
    reportOutputRoot: envString(
      "UX_INTELLIGENCE_CERTIFICATION_REPORT_ROOT",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.reportOutputRoot,
    ),
    maxRetryAttempts: envInt(
      "UX_INTELLIGENCE_CERTIFICATION_MAX_RETRIES",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    certificationTimeoutMs: envInt(
      "UX_INTELLIGENCE_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.certificationTimeoutMs,
    ),
    loggingLevel: envString(
      "UX_INTELLIGENCE_CERTIFICATION_LOG_LEVEL",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as UxIntelligenceCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "UX_INTELLIGENCE_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_UX_INTELLIGENCE_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
