import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CERTIFICATION_CHECKS, CERTIFICATION_STATUSES } from "./paths.js";
import type { CertificationRecord } from "./types.js";

export type WorkforceCertificationMonitorConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  availabilityRulesEnabled: boolean;
  reachabilityRulesEnabled: boolean;
  capabilityRulesEnabled: boolean;
  toolAccessRulesEnabled: boolean;
  governanceRulesEnabled: boolean;
  qualityRulesEnabled: boolean;
  selfCritiqueRulesEnabled: boolean;
  dependencyRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  certificationChecks: string[];
  certificationStatuses: string[];
  requireRegistration: boolean;
  requireReachability: boolean;
  requireCapabilities: boolean;
  requireToolAccess: boolean;
  requireGovernance: boolean;
  requireQualityCompliance: boolean;
  requireSelfCritiqueCompliance: boolean;
  requireRuntimeHealth: boolean;
  requireDependencyHealth: boolean;
  seedCertifications: CertificationRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-29 hard boundaries — force-locked true. */
  neverExecuteWorkerTasks: true;
  neverRepairWorkersAutomatically: true;
  neverReplaceWorkerQualityStandard: true;
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

export const DEFAULT_SEED_CERTIFICATIONS: CertificationRecord[] = [];

export const DEFAULT_WORKFORCE_CERTIFICATION_MONITOR_CONFIGURATION: WorkforceCertificationMonitorConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    availabilityRulesEnabled: true,
    reachabilityRulesEnabled: true,
    capabilityRulesEnabled: true,
    toolAccessRulesEnabled: true,
    governanceRulesEnabled: true,
    qualityRulesEnabled: true,
    selfCritiqueRulesEnabled: true,
    dependencyRulesEnabled: true,
    validationRulesEnabled: true,
    certificationChecks: [...CERTIFICATION_CHECKS],
    certificationStatuses: [...CERTIFICATION_STATUSES],
    requireRegistration: true,
    requireReachability: true,
    requireCapabilities: true,
    requireToolAccess: true,
    requireGovernance: true,
    requireQualityCompliance: true,
    requireSelfCritiqueCompliance: true,
    requireRuntimeHealth: true,
    requireDependencyHealth: true,
    seedCertifications: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverExecuteWorkerTasks: true,
    neverRepairWorkersAutomatically: true,
    neverReplaceWorkerQualityStandard: true,
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

export function buildWorkforceCertificationMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceCertificationMonitorConfiguration> = {},
): WorkforceCertificationMonitorConfiguration {
  let file: Partial<WorkforceCertificationMonitorConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "workforce-certification-monitor.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.WORKFORCE_CERTIFICATION_MONITOR_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.WORKFORCE_CERTIFICATION_MONITOR_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergedChecks = Array.from(
    new Set([
      ...DEFAULT_WORKFORCE_CERTIFICATION_MONITOR_CONFIGURATION.certificationChecks,
      ...(file.certificationChecks ?? []),
      ...(overrides.certificationChecks ?? []),
    ]),
  );
  const mergedStatuses = Array.from(
    new Set([
      ...DEFAULT_WORKFORCE_CERTIFICATION_MONITOR_CONFIGURATION.certificationStatuses,
      ...(file.certificationStatuses ?? []),
      ...(overrides.certificationStatuses ?? []),
    ]),
  );

  return {
    ...DEFAULT_WORKFORCE_CERTIFICATION_MONITOR_CONFIGURATION,
    ...file,
    ...overrides,
    certificationChecks: mergedChecks,
    certificationStatuses: mergedStatuses,
    seedCertifications: (overrides.seedCertifications ?? file.seedCertifications ?? []).map(
      (r) => ({
        ...r,
        certificationIssues: [...r.certificationIssues],
        checksPerformed: [...r.checksPerformed],
        checksFailed: [...r.checksFailed],
      }),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWorkerTasks: true,
    neverRepairWorkersAutomatically: true,
    neverReplaceWorkerQualityStandard: true,
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
