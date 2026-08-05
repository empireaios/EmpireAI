import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MISSION_PLANNING_ENGINE_IDENTITY, MPENG_METADATA_VERSION } from "./paths.js";
import type { MissionPlanningReport } from "./types.js";

export type MissionPlanningEngineConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: MissionPlanningReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q13-03 hard boundaries — force-locked true. */
  neverModifyRepository: true;
  neverExecuteImplementation: true;
  neverFabricateRepositoryState: true;
  neverImplementQ1304OrLater: true;
  neverBypassGovernance: true;
  neverAutoDeploy: true;
  neverIgnoreDiscoveredDependencies: true;
  neverBypassArchitecturalConstraints: true;
  preservePlanningHistory: true;
  preserveAuditHistory: true;
  planningOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_MISSION_PLANNING_ENGINE_CONFIGURATION: MissionPlanningEngineConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "intelligence_context",
    "audit_runtime",
    "executive_reporting_runtime",
    "pillow_orchestration_runtime",
    "empire_knowledge_engine",
  ],
  workerId: MISSION_PLANNING_ENGINE_IDENTITY.workerId,
  workerName: MISSION_PLANNING_ENGINE_IDENTITY.workerName,
  factory: MISSION_PLANNING_ENGINE_IDENTITY.factory,
  department: MISSION_PLANNING_ENGINE_IDENTITY.department,
  role: MISSION_PLANNING_ENGINE_IDENTITY.role,
  reportingLine: [...MISSION_PLANNING_ENGINE_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 30000,
  loggingLevel: "info",
  neverModifyRepository: true,
  neverExecuteImplementation: true,
  neverFabricateRepositoryState: true,
  neverImplementQ1304OrLater: true,
  neverBypassGovernance: true,
  neverAutoDeploy: true,
  neverIgnoreDiscoveredDependencies: true,
  neverBypassArchitecturalConstraints: true,
  preservePlanningHistory: true,
  preserveAuditHistory: true,
  planningOnly: true,
  maskSensitiveValues: true,
};

export function buildMissionPlanningEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MissionPlanningEngineConfiguration> = {},
): MissionPlanningEngineConfiguration {
  let file: Partial<MissionPlanningEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "mission-planning-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const timeout = Number.parseInt(process.env.MISSION_PLANNING_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MISSION_PLANNING_ENGINE_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_MISSION_PLANNING_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_MISSION_PLANNING_ENGINE_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MISSION_PLANNING_ENGINE_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverModifyRepository: true,
    neverExecuteImplementation: true,
    neverFabricateRepositoryState: true,
    neverImplementQ1304OrLater: true,
    neverBypassGovernance: true,
    neverAutoDeploy: true,
    neverIgnoreDiscoveredDependencies: true,
    neverBypassArchitecturalConstraints: true,
    preservePlanningHistory: true,
    preserveAuditHistory: true,
    planningOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: MissionPlanningReport): MissionPlanningReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    historyRefs: [...report.historyRefs],
    metadataVersion: report.metadataVersion || MPENG_METADATA_VERSION,
    neverImplementQ1304OrLater: true,
    neverModifyRepository: true,
    neverExecuteImplementation: true,
    neverFabricateRepositoryState: true,
    neverBypassGovernance: true,
    neverAutoDeploy: true,
    preservePlanningHistory: true,
    planningOnly: true,
  };
}
