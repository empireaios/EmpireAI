import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ISENG_METADATA_VERSION, IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY, INTEGRATION_TARGETS } from "./paths.js";
import type { ImplementationSpecificationReport } from "./types.js";

export type ImplementationSpecificationEngineConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: ImplementationSpecificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  scanRoots: string[];
  /** Q13-01 hard boundaries — force-locked true. */
  neverFabricateRepositoryState: true;
  neverOverwriteVerifiedImplementations: true;
  neverExecuteImplementations: true;
  neverAutoDeploy: true;
  neverBypassGovernance: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1302OrLater: true;
  preserveCompleteTraceability: true;
  preserveSpecificationHistory: true;
  preserveAuditHistory: true;
  deterministicSpecificationBehaviour: true;
  evidenceBasedOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION: ImplementationSpecificationEngineConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.workerId,
  workerName: IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.workerName,
  factory: IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.factory,
  department: IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.department,
  role: IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.role,
  reportingLine: [...IMPLEMENTATION_SPECIFICATION_ENGINE_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  scanRoots: ["pillow/src", "backend/src", "config"],
  neverFabricateRepositoryState: true,
  neverOverwriteVerifiedImplementations: true,
  neverExecuteImplementations: true,
  neverAutoDeploy: true,
  neverBypassGovernance: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1302OrLater: true,
  preserveCompleteTraceability: true,
  preserveSpecificationHistory: true,
  preserveAuditHistory: true,
  deterministicSpecificationBehaviour: true,
  evidenceBasedOnly: true,
  maskSensitiveValues: true,
};

export function buildImplementationSpecificationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ImplementationSpecificationEngineConfiguration> = {},
): ImplementationSpecificationEngineConfiguration {
  let file: Partial<ImplementationSpecificationEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "implementation-specification-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.IMPLEMENTATION_SPECIFICATION_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.IMPLEMENTATION_SPECIFICATION_ENGINE_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ?? file.reportingLine ?? DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION.reportingLine),
    ],
    scanRoots: [
      ...(overrides.scanRoots ?? file.scanRoots ?? DEFAULT_IMPLEMENTATION_SPECIFICATION_ENGINE_CONFIGURATION.scanRoots),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverFabricateRepositoryState: true,
    neverOverwriteVerifiedImplementations: true,
    neverExecuteImplementations: true,
    neverAutoDeploy: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1302OrLater: true,
    preserveCompleteTraceability: true,
    preserveSpecificationHistory: true,
    preserveAuditHistory: true,
    deterministicSpecificationBehaviour: true,
    evidenceBasedOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ImplementationSpecificationReport): ImplementationSpecificationReport {
  return {
    ...report,
    specifications: report.specifications.map((s) => ({
      ...s,
      repositoryFindings: [...s.repositoryFindings],
      dependencies: [...s.dependencies],
      filesExpected: [...s.filesExpected],
      requiredCapabilities: [...s.requiredCapabilities],
      validationPlan: [...s.validationPlan],
      integrationPlan: [...s.integrationPlan],
      constraints: [...s.constraints],
      governanceRequirements: [...s.governanceRequirements],
    })),
    traceabilityRefs: [...report.traceabilityRefs],
    risks: report.risks.map((r) => ({ ...r })),
    metadataVersion: report.metadataVersion || ISENG_METADATA_VERSION,
    neverImplementQ1302OrLater: true,
    neverExecuteImplementations: true,
    neverAutoDeploy: true,
    evidenceBasedOnly: true,
    preserveCompleteTraceability: true,
    preserveSpecificationHistory: true,
    preserveAuditHistory: true,
    deterministicSpecificationBehaviour: true,
    maskSensitiveValues: true,
    neverFabricateRepositoryState: true,
    neverOverwriteVerifiedImplementations: true,
    neverBypassGovernance: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
  };
}
