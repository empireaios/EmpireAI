import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFIED_MODULE_IDS, CERTIFIED_PROGRAMME_IDS } from "./paths.js";

export type EmpireCertifiedConfiguration = {
  enabled: boolean;
  certificationScope: string[];
  programmeScope: string[];
  validationRules: string[];
  passThresholdPercent: number;
  retryPolicy: { maxAttempts: number; backoffMs: number };
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  safeTestMode: true;
  neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveCertificationTraceability: true;
  preserveAuditability: true;
  preserveConstitutionalIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EMPIRE_CERTIFIED_CONFIGURATION: EmpireCertifiedConfiguration = {
  enabled: true,
  certificationScope: [...CERTIFIED_MODULE_IDS],
  programmeScope: [...CERTIFIED_PROGRAMME_IDS],
  validationRules: [
    "structural-probes-only",
    "safe-test-mode-required",
    "no-credential-exposure",
    "constitutional-integrity",
  ],
  passThresholdPercent: 85,
  retryPolicy: { maxAttempts: 2, backoffMs: 50 },
  timeoutMs: 30_000,
  loggingLevel: "info",
  safeTestMode: true,
  neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveCertificationTraceability: true,
  preserveAuditability: true,
  preserveConstitutionalIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildEmpireCertifiedConfiguration(
  root?: string,
  overrides: Partial<EmpireCertifiedConfiguration> = {},
): EmpireCertifiedConfiguration {
  let file: Partial<EmpireCertifiedConfiguration> = {};
  const path = root && join(root, "config", "empire-certified.config.json");
  if (path && existsSync(path)) {
    try {
      file = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  return {
    ...DEFAULT_EMPIRE_CERTIFIED_CONFIGURATION,
    ...file,
    ...overrides,
    certificationScope: overrides.certificationScope ?? file.certificationScope ?? [...CERTIFIED_MODULE_IDS],
    programmeScope: overrides.programmeScope ?? file.programmeScope ?? [...CERTIFIED_PROGRAMME_IDS],
    validationRules: overrides.validationRules ?? file.validationRules ?? DEFAULT_EMPIRE_CERTIFIED_CONFIGURATION.validationRules,
    retryPolicy: {
      ...DEFAULT_EMPIRE_CERTIFIED_CONFIGURATION.retryPolicy,
      ...(file.retryPolicy ?? {}),
      ...(overrides.retryPolicy ?? {}),
    },
    safeTestMode: true,
    neverModifyProductionSystemsDuringCertificationUnlessExplicitSafeTestMode: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCertificationTraceability: true,
    preserveAuditability: true,
    preserveConstitutionalIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
