/** T4-10 — Externalized Executive Collaboration Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { T4_MISSION_IDS } from "./paths.js";
import type { T4MissionId } from "./types.js";

export type ExecutiveCollaborationCertificationConfiguration = {
  enabled: boolean;
  validationScope: T4MissionId[];
  testSessionDurationMs: number;
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
  validateGovernanceRules: boolean;
  requireT3AutonomousBuilderCertified: boolean;
};

export const DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION: ExecutiveCollaborationCertificationConfiguration =
  {
    enabled: true,
    validationScope: [...T4_MISSION_IDS],
    testSessionDurationMs: 120000,
    requiredPassThreshold: 50,
    requireEndToEndPass: true,
    reportOutputRoot: ".pillow-executive-collaboration-certification",
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    certificationTimeoutMs: 300000,
    loggingLevel: "info",
    autoRecover: true,
    validateHealthReporting: true,
    validateRecoveryBehavior: true,
    validateMetadataRules: true,
    validateGovernanceRules: true,
    requireT3AutonomousBuilderCertified: false,
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

export function loadExecutiveCollaborationCertificationConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveCollaborationCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-collaboration-certification.config.json"),
    join(repositoryRoot, "config", "executive-collaboration-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveCollaborationCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveCollaborationCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveCollaborationCertificationConfiguration> = {},
): ExecutiveCollaborationCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveCollaborationCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveCollaborationCertificationConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_ENABLED",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.enabled,
    ),
    requiredPassThreshold: envFloat(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.requiredPassThreshold,
    ),
    requireEndToEndPass: envBool(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_REQUIRE_E2E",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.requireEndToEndPass,
    ),
    reportOutputRoot: envString(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_REPORT_ROOT",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.reportOutputRoot,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_MAX_RETRIES",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    certificationTimeoutMs: envInt(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.certificationTimeoutMs,
    ),
    loggingLevel: envString(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_LOG_LEVEL",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as ExecutiveCollaborationCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_COLLABORATION_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_COLLABORATION_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
