/** T5-10 — Externalized Visual Intelligence Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CERTIFIED_PROGRAMMES } from "./paths.js";
import type { CertifiedProgramme } from "./types.js";

export type VisualIntelligenceCertificationConfiguration = {
  enabled: boolean;
  validationScope: CertifiedProgramme[];
  requiredPassThreshold: number;
  requireEndToEndPass: boolean;
  requireProductionReadiness: boolean;
  requireGovernanceCompliance: boolean;
  governanceVerificationRulesEnabled: boolean;
  healthVerificationRulesEnabled: boolean;
  recoveryVerificationRulesEnabled: boolean;
  metadataValidationRulesEnabled: boolean;
  reportGenerationRulesEnabled: boolean;
  reportOutputRoot: string;
  maxRetryAttempts: number;
  retryDelayMs: number;
  certificationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateHealthReporting: boolean;
  validateRecoveryBehavior: boolean;
  runNestedProgrammeCertifications: boolean;
  certifyOnlyMode: true;
};

export const DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION: VisualIntelligenceCertificationConfiguration =
  {
    enabled: true,
    validationScope: [...CERTIFIED_PROGRAMMES],
    requiredPassThreshold: 50,
    requireEndToEndPass: true,
    requireProductionReadiness: true,
    requireGovernanceCompliance: true,
    governanceVerificationRulesEnabled: true,
    healthVerificationRulesEnabled: true,
    recoveryVerificationRulesEnabled: true,
    metadataValidationRulesEnabled: true,
    reportGenerationRulesEnabled: true,
    reportOutputRoot: ".pillow-visual-intelligence-certification",
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    certificationTimeoutMs: 300000,
    loggingLevel: "info",
    autoRecover: true,
    validateHealthReporting: true,
    validateRecoveryBehavior: true,
    runNestedProgrammeCertifications: true,
    certifyOnlyMode: true,
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

export function loadVisualIntelligenceCertificationConfigFile(
  repositoryRoot: string,
): Partial<VisualIntelligenceCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "visual-intelligence-certification.config.json"),
    join(repositoryRoot, "config", "visual-intelligence-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<VisualIntelligenceCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVisualIntelligenceCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualIntelligenceCertificationConfiguration> = {},
): VisualIntelligenceCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadVisualIntelligenceCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<VisualIntelligenceCertificationConfiguration> = {
    enabled: envBool(
      "VISUAL_INTELLIGENCE_CERTIFICATION_ENABLED",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.enabled,
    ),
    requiredPassThreshold: envFloat(
      "VISUAL_INTELLIGENCE_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.requiredPassThreshold,
    ),
    requireEndToEndPass: envBool(
      "VISUAL_INTELLIGENCE_CERTIFICATION_REQUIRE_E2E",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.requireEndToEndPass,
    ),
    reportOutputRoot: envString(
      "VISUAL_INTELLIGENCE_CERTIFICATION_REPORT_ROOT",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.reportOutputRoot,
    ),
    maxRetryAttempts: envInt(
      "VISUAL_INTELLIGENCE_CERTIFICATION_MAX_RETRIES",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.maxRetryAttempts,
    ),
    certificationTimeoutMs: envInt(
      "VISUAL_INTELLIGENCE_CERTIFICATION_TIMEOUT_MS",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.certificationTimeoutMs,
    ),
    loggingLevel: envString(
      "VISUAL_INTELLIGENCE_CERTIFICATION_LOG_LEVEL",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as VisualIntelligenceCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VISUAL_INTELLIGENCE_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_VISUAL_INTELLIGENCE_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    certifyOnlyMode: true,
  };
}
