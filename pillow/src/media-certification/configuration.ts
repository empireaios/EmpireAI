import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CERTIFICATION_LEVELS,
  MEDIA_FACTORY_COMPONENTS,
  MEDIA_FACTORY_VERSION,
  MEDIA_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type { MediaCertificationReport } from "./types.js";

export type MediaCertificationConfiguration = {
  enabled: boolean;
  certificationRulesEnabled: boolean;
  componentRulesEnabled: boolean;
  integrationRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  readinessRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  mediaFactoryVersion: string;
  mediaFactoryComponents: string[];
  certificationLevels: string[];
  integrationDomains: string[];
  governanceRules: string[];
  maxFailuresForProvisional: number;
  maxWarningsForCertifiedWithWarnings: number;
  defaultMediaBusinessMission: string;
  seedReports: MediaCertificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-19 hard boundaries — force-locked true. */
  neverPublishMedia: true;
  neverModifyMediaFactoryComponents: true;
  neverRepairFailuresAutomatically: true;
  neverBeginQ5Implementation: true;
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

export const DEFAULT_MEDIA_CERTIFICATION_CONFIGURATION: MediaCertificationConfiguration =
  {
    enabled: true,
    certificationRulesEnabled: true,
    componentRulesEnabled: true,
    integrationRulesEnabled: true,
    governanceRulesEnabled: true,
    readinessRulesEnabled: true,
    validationRulesEnabled: true,
    mediaFactoryVersion: MEDIA_FACTORY_VERSION,
    mediaFactoryComponents: MEDIA_FACTORY_COMPONENTS.map((c) => c.id),
    certificationLevels: [...CERTIFICATION_LEVELS],
    integrationDomains: [...INTEGRATION_DOMAINS],
    governanceRules: [...MEDIA_GOVERNANCE_RULES],
    maxFailuresForProvisional: 2,
    maxWarningsForCertifiedWithWarnings: 5,
    defaultMediaBusinessMission: "Lean media channel for content operations",
    seedReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverPublishMedia: true,
    neverModifyMediaFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ5Implementation: true,
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

export function buildMediaCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MediaCertificationConfiguration> = {},
): MediaCertificationConfiguration {
  let file: Partial<MediaCertificationConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "media-certification.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.MEDIA_CERTIFICATION_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.MEDIA_CERTIFICATION_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "mediaFactoryComponents"
      | "certificationLevels"
      | "integrationDomains"
      | "governanceRules",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_MEDIA_CERTIFICATION_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_MEDIA_CERTIFICATION_CONFIGURATION,
    ...file,
    ...overrides,
    mediaFactoryComponents: mergeList("mediaFactoryComponents"),
    certificationLevels: mergeList("certificationLevels"),
    integrationDomains: mergeList("integrationDomains"),
    governanceRules: mergeList("governanceRules"),
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => ({
      ...r,
      mediaBusinessesTested: [...r.mediaBusinessesTested],
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
    neverPublishMedia: true,
    neverModifyMediaFactoryComponents: true,
    neverRepairFailuresAutomatically: true,
    neverBeginQ5Implementation: true,
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
