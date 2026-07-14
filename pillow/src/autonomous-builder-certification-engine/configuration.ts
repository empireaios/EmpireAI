/** T3-10 — Externalized Autonomous Builder Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { T3_MISSION_IDS } from "./paths.js";
import type { T3MissionId } from "./types.js";

export type AutonomousBuilderCertificationConfiguration = {
  enabled: boolean;
  validationScope: T3MissionId[];
  testWorkflowDurationMs: number;
  requiredPassThreshold: number;
  requireEndToEndPass: boolean;
  reportOutputRoot: string;
  maxRetryAttempts: number;
  retryDelayMs: number;
  certificationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateHealthReporting: boolean;
  validateRecoveryBehavior: boolean;
  validateMetadataRules: boolean;
  validateProductionSafety: boolean;
  requireT2UxIntelligenceCertified: boolean;
};

export const DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION: AutonomousBuilderCertificationConfiguration =
  {
    enabled: true,
    validationScope: [...T3_MISSION_IDS],
    testWorkflowDurationMs: 120000,
    requiredPassThreshold: 50,
    requireEndToEndPass: true,
    reportOutputRoot: ".pillow-autonomous-builder-certification",
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    certificationTimeoutMs: 300000,
    loggingLevel: "info",
    autoRecover: true,
    validateHealthReporting: true,
    validateRecoveryBehavior: true,
    validateMetadataRules: true,
    validateProductionSafety: true,
    requireT2UxIntelligenceCertified: false,
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

export function loadAutonomousBuilderCertificationConfigFile(
  repositoryRoot: string,
): Partial<AutonomousBuilderCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-builder-certification.config.json"),
    join(repositoryRoot, "config", "autonomous-builder-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousBuilderCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousBuilderCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousBuilderCertificationConfiguration> = {},
): AutonomousBuilderCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousBuilderCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AutonomousBuilderCertificationConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_BUILDER_CERTIFICATION_ENABLED",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.enabled,
    ),
    requiredPassThreshold: envFloat(
      "AUTONOMOUS_BUILDER_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.requiredPassThreshold,
    ),
    requireEndToEndPass: envBool(
      "AUTONOMOUS_BUILDER_CERTIFICATION_REQUIRE_E2E",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.requireEndToEndPass,
    ),
    reportOutputRoot: envString(
      "AUTONOMOUS_BUILDER_CERTIFICATION_REPORT_ROOT",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.reportOutputRoot,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_BUILDER_CERTIFICATION_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    certificationTimeoutMs: envInt(
      "AUTONOMOUS_BUILDER_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.certificationTimeoutMs,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_BUILDER_CERTIFICATION_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as AutonomousBuilderCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_BUILDER_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_BUILDER_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
