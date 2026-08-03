import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  INTEGRATION_DOMAINS,
  WORKFORCE_FACTORY_COMPONENTS,
  WORKFORCE_FACTORY_VERSION,
  WORKFORCE_GOVERNANCE_RULES,
} from "./paths.js";
import type { WorkforceFactoryCertificationReport } from "./types.js";

export type WorkforceFactoryCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  workforceFactoryVersion: string;
  workforceFactoryComponents: string[];
  certificationLevels: string[];
  integrationDomains: string[];
  governanceRules: string[];
  maxFailuresForProvisional: number;
  maxWarningsForCertifiedWithWarnings: number;
  seedReports: WorkforceFactoryCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q1-13 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverModifyWorkforceComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ2Implementation: true;
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

export const DEFAULT_WORKFORCE_FACTORY_CERTIFICATION_CONFIGURATION: WorkforceFactoryCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    governanceRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    workforceFactoryVersion: WORKFORCE_FACTORY_VERSION,
    workforceFactoryComponents: WORKFORCE_FACTORY_COMPONENTS.map((c) => c.id),
    certificationLevels: [...CERTIFICATION_LEVELS],
    integrationDomains: [...INTEGRATION_DOMAINS],
    governanceRules: [...WORKFORCE_GOVERNANCE_RULES],
    maxFailuresForProvisional: 2,
    maxWarningsForCertifiedWithWarnings: 5,
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverModifyWorkforceComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ2Implementation: true,
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

export function buildWorkforceFactoryCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceFactoryCertificationConfiguration> = {},
): WorkforceFactoryCertificationConfiguration {
  let file: Partial<WorkforceFactoryCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-factory-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.WORKFORCE_FACTORY_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.WORKFORCE_FACTORY_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "workforceFactoryComponents"
      | "certificationLevels"
      | "integrationDomains"
      | "governanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_WORKFORCE_FACTORY_CERTIFICATION_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_WORKFORCE_FACTORY_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    workforceFactoryComponents: mergeList("workforceFactoryComponents"),
    certificationLevels: mergeList("certificationLevels"),
    integrationDomains: mergeList("integrationDomains"),
    governanceRules: mergeList("governanceRules"),
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => ({
      ...r,
      componentsTested: [...r.componentsTested],
      componentsPassed: [...r.componentsPassed],
      componentsFailed: [...r.componentsFailed],
      componentsWarned: [...r.componentsWarned],
      remainingRisks: [...r.remainingRisks],
      recommendations: [...r.recommendations],
      componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
      governanceVerifications: r.governanceVerifications.map((v) => ({ ...v })),
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverModifyWorkforceComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ2Implementation: true,
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
