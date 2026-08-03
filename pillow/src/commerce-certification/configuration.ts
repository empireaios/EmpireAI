import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  COMMERCE_FACTORY_COMPONENTS,
  COMMERCE_FACTORY_VERSION,
  COMMERCE_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type { CommerceCertificationReport } from "./types.js";

export type CommerceCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  commerceFactoryVersion: string;
  commerceFactoryComponents: string[];
  certificationLevels: string[];
  integrationDomains: string[];
  governanceRules: string[];
  maxFailuresForProvisional: number;
  maxWarningsForCertifiedWithWarnings: number;
  defaultBusinessMission: string;
  seedReports: CommerceCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q3-14 hard boundaries — force-locked true. */
  neverOperateLiveCommerceBusiness: true;
  neverModifyCommerceFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ4Implementation: true;
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

export const DEFAULT_COMMERCE_CERTIFICATION_CONFIGURATION: CommerceCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    governanceRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    commerceFactoryVersion: COMMERCE_FACTORY_VERSION,
    commerceFactoryComponents: COMMERCE_FACTORY_COMPONENTS.map((c) => c.id),
    certificationLevels: [...CERTIFICATION_LEVELS],
    integrationDomains: [...INTEGRATION_DOMAINS],
    governanceRules: [...COMMERCE_GOVERNANCE_RULES],
    maxFailuresForProvisional: 2,
    maxWarningsForCertifiedWithWarnings: 5,
    defaultBusinessMission: "Lean commerce catalog for local retailers",
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverOperateLiveCommerceBusiness: true,
    neverModifyCommerceFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ4Implementation: true,
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

export function buildCommerceCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CommerceCertificationConfiguration> = {},
): CommerceCertificationConfiguration {
  let file: Partial<CommerceCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "commerce-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.COMMERCE_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.COMMERCE_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "commerceFactoryComponents"
      | "certificationLevels"
      | "integrationDomains"
      | "governanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_COMMERCE_CERTIFICATION_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_COMMERCE_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    commerceFactoryComponents: mergeList("commerceFactoryComponents"),
    certificationLevels: mergeList("certificationLevels"),
    integrationDomains: mergeList("integrationDomains"),
    governanceRules: mergeList("governanceRules"),
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => ({
      ...r,
      componentsTested: [...r.componentsTested],
      componentsPassed: [...r.componentsPassed],
      componentsFailed: [...r.componentsFailed],
      componentsWarned: [...r.componentsWarned],
      outstandingRisks: [...r.outstandingRisks],
      recommendations: [...r.recommendations],
      componentVerifications: r.componentVerifications.map((v) => ({ ...v })),
      integrationVerifications: r.integrationVerifications.map((v) => ({ ...v })),
      governanceVerifications: r.governanceVerifications.map((v) => ({ ...v })),
      traceabilityChain: r.traceabilityChain.map((t) => ({ ...t })),
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverOperateLiveCommerceBusiness: true,
    neverModifyCommerceFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ4Implementation: true,
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
