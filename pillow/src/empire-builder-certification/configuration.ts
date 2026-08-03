import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  EMPIRE_BUILDER_COMPONENTS,
  EMPIRE_BUILDER_FACTORY_VERSION,
  INTEGRATION_DOMAINS,
  PLANNING_GOVERNANCE_RULES,
} from "./paths.js";
import type { EmpireBuilderCertificationReport } from "./types.js";

export type EmpireBuilderCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  empireBuilderFactoryVersion: string;
  empireBuilderComponents: string[];
  certificationLevels: string[];
  integrationDomains: string[];
  governanceRules: string[];
  maxFailuresForProvisional: number;
  maxWarningsForCertifiedWithWarnings: number;
  defaultGrandKingCommand: string;
  seedReports: EmpireBuilderCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q2-10 hard boundaries — force-locked true. */
  neverExecuteBusinessImplementation: true;
  neverModifyFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ3Implementation: true;
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

export const DEFAULT_EMPIRE_BUILDER_CERTIFICATION_CONFIGURATION: EmpireBuilderCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    governanceRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    empireBuilderFactoryVersion: EMPIRE_BUILDER_FACTORY_VERSION,
    empireBuilderComponents: EMPIRE_BUILDER_COMPONENTS.map((c) => c.id),
    certificationLevels: [...CERTIFICATION_LEVELS],
    integrationDomains: [...INTEGRATION_DOMAINS],
    governanceRules: [...PLANNING_GOVERNANCE_RULES],
    maxFailuresForProvisional: 2,
    maxWarningsForCertifiedWithWarnings: 5,
    defaultGrandKingCommand:
      "Build a lean commerce business for local retailers using Shopify",
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteBusinessImplementation: true,
    neverModifyFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ3Implementation: true,
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

export function buildEmpireBuilderCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EmpireBuilderCertificationConfiguration> = {},
): EmpireBuilderCertificationConfiguration {
  let file: Partial<EmpireBuilderCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "empire-builder-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.EMPIRE_BUILDER_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.EMPIRE_BUILDER_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "empireBuilderComponents"
      | "certificationLevels"
      | "integrationDomains"
      | "governanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_EMPIRE_BUILDER_CERTIFICATION_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_EMPIRE_BUILDER_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    empireBuilderComponents: mergeList("empireBuilderComponents"),
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
    neverExecuteBusinessImplementation: true,
    neverModifyFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ3Implementation: true,
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
