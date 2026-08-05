import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CURSOR_SPECIFICATION_GENERATOR_IDENTITY, CSGEN_METADATA_VERSION } from "./paths.js";
import type { CursorSpecificationReport } from "./types.js";

export type CursorSpecificationGeneratorConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: CursorSpecificationReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q13-04 hard boundaries — force-locked true. */
  neverImplementCode: true;
  neverExecuteCursorMissions: true;
  neverFabricateRepositoryFindings: true;
  neverInventMissions: true;
  neverImplementQ1305OrLater: true;
  neverSelfApprove: true;
  neverBypassGovernance: true;
  neverAlterDeliverables: true;
  neverRenameMissions: true;
  preserveSpecificationHistory: true;
  preserveAuditHistory: true;
  specificationOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_CURSOR_SPECIFICATION_GENERATOR_CONFIGURATION: CursorSpecificationGeneratorConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [
    "mission_planning_engine",
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "empire_knowledge_engine",
    "approval_runtime",
    "grand_king_acceptance_gate",
    "pillow_orchestration_runtime",
    "audit_runtime",
    "executive_reporting_runtime",
    "intelligence_context",
  ],
  workerId: CURSOR_SPECIFICATION_GENERATOR_IDENTITY.workerId,
  workerName: CURSOR_SPECIFICATION_GENERATOR_IDENTITY.workerName,
  factory: CURSOR_SPECIFICATION_GENERATOR_IDENTITY.factory,
  department: CURSOR_SPECIFICATION_GENERATOR_IDENTITY.department,
  role: CURSOR_SPECIFICATION_GENERATOR_IDENTITY.role,
  reportingLine: [...CURSOR_SPECIFICATION_GENERATOR_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 30000,
  loggingLevel: "info",
  neverImplementCode: true,
  neverExecuteCursorMissions: true,
  neverFabricateRepositoryFindings: true,
  neverInventMissions: true,
  neverImplementQ1305OrLater: true,
  neverSelfApprove: true,
  neverBypassGovernance: true,
  neverAlterDeliverables: true,
  neverRenameMissions: true,
  preserveSpecificationHistory: true,
  preserveAuditHistory: true,
  specificationOnly: true,
  maskSensitiveValues: true,
};

export function buildCursorSpecificationGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CursorSpecificationGeneratorConfiguration> = {},
): CursorSpecificationGeneratorConfiguration {
  let file: Partial<CursorSpecificationGeneratorConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "cursor-specification-generator.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const timeout = Number.parseInt(process.env.CURSOR_SPECIFICATION_GENERATOR_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CURSOR_SPECIFICATION_GENERATOR_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_CURSOR_SPECIFICATION_GENERATOR_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_CURSOR_SPECIFICATION_GENERATOR_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_CURSOR_SPECIFICATION_GENERATOR_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverImplementCode: true,
    neverExecuteCursorMissions: true,
    neverFabricateRepositoryFindings: true,
    neverInventMissions: true,
    neverImplementQ1305OrLater: true,
    neverSelfApprove: true,
    neverBypassGovernance: true,
    neverAlterDeliverables: true,
    neverRenameMissions: true,
    preserveSpecificationHistory: true,
    preserveAuditHistory: true,
    specificationOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: CursorSpecificationReport): CursorSpecificationReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    historyRefs: [...report.historyRefs],
    metadataVersion: report.metadataVersion || CSGEN_METADATA_VERSION,
    neverImplementQ1305OrLater: true,
    neverImplementCode: true,
    neverExecuteCursorMissions: true,
    neverSelfApprove: true,
    neverInventMissions: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    preserveSpecificationHistory: true,
    specificationOnly: true,
  };
}
