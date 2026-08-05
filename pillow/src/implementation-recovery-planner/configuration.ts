import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY, IRPLN_METADATA_VERSION } from "./paths.js";
import type { RecoveryReport } from "./types.js";

export type ImplementationRecoveryPlannerConfiguration = {
  enabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  repositoryRoot: string;
  seedReports: RecoveryReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q13-05 hard boundaries — force-locked true. */
  neverExecuteRecovery: true;
  neverModifyRepository: true;
  neverFabricateRepositoryFindings: true;
  neverOverwriteVerifiedImplementations: true;
  neverDeleteProductionCodeWithoutEvidence: true;
  neverRestartCompletedWorkUnnecessarily: true;
  neverImplementQ1306OrLater: true;
  neverBypassGovernance: true;
  preserveRecoveryHistory: true;
  preserveAuditHistory: true;
  recoveryPlanningOnly: true;
  maskSensitiveValues: boolean;
};

export const DEFAULT_IMPLEMENTATION_RECOVERY_PLANNER_CONFIGURATION: ImplementationRecoveryPlannerConfiguration = {
  enabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [
    "cursor_specification_generator",
    "repository_intelligence_engine",
    "implementation_specification_engine",
    "mission_planning_engine",
    "empire_knowledge_engine",
    "pillow_orchestration_runtime",
    "audit_runtime",
    "executive_reporting_runtime",
  ],
  workerId: IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.workerId,
  workerName: IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.workerName,
  factory: IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.factory,
  department: IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.department,
  role: IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.role,
  reportingLine: [...IMPLEMENTATION_RECOVERY_PLANNER_IDENTITY.reportingLine],
  repositoryRoot: "",
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 30000,
  loggingLevel: "info",
  neverExecuteRecovery: true,
  neverModifyRepository: true,
  neverFabricateRepositoryFindings: true,
  neverOverwriteVerifiedImplementations: true,
  neverDeleteProductionCodeWithoutEvidence: true,
  neverRestartCompletedWorkUnnecessarily: true,
  neverImplementQ1306OrLater: true,
  neverBypassGovernance: true,
  preserveRecoveryHistory: true,
  preserveAuditHistory: true,
  recoveryPlanningOnly: true,
  maskSensitiveValues: true,
};

export function buildImplementationRecoveryPlannerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ImplementationRecoveryPlannerConfiguration> = {},
): ImplementationRecoveryPlannerConfiguration {
  let file: Partial<ImplementationRecoveryPlannerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "implementation-recovery-planner.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const timeout = Number.parseInt(process.env.IMPLEMENTATION_RECOVERY_PLANNER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.IMPLEMENTATION_RECOVERY_PLANNER_RETRY_ATTEMPTS ?? "", 10);

  return {
    ...DEFAULT_IMPLEMENTATION_RECOVERY_PLANNER_CONFIGURATION,
    ...file,
    ...overrides,
    repositoryRoot: repositoryRoot ?? overrides.repositoryRoot ?? file.repositoryRoot ?? "",
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_IMPLEMENTATION_RECOVERY_PLANNER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_IMPLEMENTATION_RECOVERY_PLANNER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((report) => lockReport(report)),
    ...(Number.isFinite(timeout) && timeout > 0 ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) && retries > 0 ? { retryPolicyAttempts: retries } : {}),
    neverExecuteRecovery: true,
    neverModifyRepository: true,
    neverFabricateRepositoryFindings: true,
    neverOverwriteVerifiedImplementations: true,
    neverDeleteProductionCodeWithoutEvidence: true,
    neverRestartCompletedWorkUnnecessarily: true,
    neverImplementQ1306OrLater: true,
    neverBypassGovernance: true,
    preserveRecoveryHistory: true,
    preserveAuditHistory: true,
    recoveryPlanningOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: RecoveryReport): RecoveryReport {
  return {
    ...report,
    supportingEvidence: [...report.supportingEvidence],
    traceabilityRefs: [...report.traceabilityRefs],
    historyRefs: [...report.historyRefs],
    metadataVersion: report.metadataVersion || IRPLN_METADATA_VERSION,
    neverImplementQ1306OrLater: true,
    neverExecuteRecovery: true,
    neverModifyRepository: true,
    neverOverwriteVerifiedImplementations: true,
    neverDeleteProductionCodeWithoutEvidence: true,
    neverRestartCompletedWorkUnnecessarily: true,
    neverFabricateRepositoryFindings: true,
    neverBypassGovernance: true,
    preserveRecoveryHistory: true,
    recoveryPlanningOnly: true,
  };
}
