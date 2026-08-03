import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  EXECUTIVE_COMPONENTS,
  EXECUTIVE_FACTORY_VERSION,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type { UnifiedCertificationReport } from "./types.js";

export type UnifiedWorkforceCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveFactoryVersion: string;
  executiveComponents: string[];
  certificationLevels: string[];
  integrationDomains: string[];
  maxFailuresForProvisional: number;
  maxWarningsForCertifiedWithWarnings: number;
  seedReports: UnifiedCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-30 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverModifyExecutiveComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ1Implementation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveCertificationTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_UNIFIED_WORKFORCE_CERTIFICATION_CONFIGURATION: UnifiedWorkforceCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    executiveFactoryVersion: EXECUTIVE_FACTORY_VERSION,
    executiveComponents: EXECUTIVE_COMPONENTS.map((c) => c.id),
    certificationLevels: [...CERTIFICATION_LEVELS],
    integrationDomains: [...INTEGRATION_DOMAINS],
    maxFailuresForProvisional: 2,
    maxWarningsForCertifiedWithWarnings: 5,
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverModifyExecutiveComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ1Implementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCertificationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildUnifiedWorkforceCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UnifiedWorkforceCertificationConfiguration> = {},
): UnifiedWorkforceCertificationConfiguration {
  let file: Partial<UnifiedWorkforceCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "unified-workforce-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.UNIFIED_WORKFORCE_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.UNIFIED_WORKFORCE_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedComponents = Array.from(
    new Set([
      ...DEFAULT_UNIFIED_WORKFORCE_CERTIFICATION_CONFIGURATION.executiveComponents,
      ...(file.executiveComponents ?? []),
      ...(overrides.executiveComponents ?? []),
    ]),
  );
  const mergedLevels = Array.from(
    new Set([
      ...DEFAULT_UNIFIED_WORKFORCE_CERTIFICATION_CONFIGURATION.certificationLevels,
      ...(file.certificationLevels ?? []),
      ...(overrides.certificationLevels ?? []),
    ]),
  );
  const mergedDomains = Array.from(
    new Set([
      ...DEFAULT_UNIFIED_WORKFORCE_CERTIFICATION_CONFIGURATION.integrationDomains,
      ...(file.integrationDomains ?? []),
      ...(overrides.integrationDomains ?? []),
    ]),
  );

  return {
    ...DEFAULT_UNIFIED_WORKFORCE_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    executiveComponents: mergedComponents,
    certificationLevels: mergedLevels,
    integrationDomains: mergedDomains,
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => ({
      ...r,
      executiveComponentsTested: [...r.executiveComponentsTested],
      componentsPassed: [...r.componentsPassed],
      componentsFailed: [...r.componentsFailed],
      componentsWarned: [...r.componentsWarned],
      remainingRisks: [...r.remainingRisks],
      recommendations: [...r.recommendations],
      componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverModifyExecutiveComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ1Implementation: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveCertificationTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
