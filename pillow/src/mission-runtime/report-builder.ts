import {
  MISSION_LIFECYCLE_STATES,
  MISSION_TYPES,
  MSR_CAPABILITIES,
  MSR_METADATA_VERSION,
  MSR_REPORT_VERSION,
  MSR_RUNTIME_VERSION,
} from "./paths.js";
import { nextMsrId } from "./mission-store.js";
import type { MissionRuntimeConfiguration } from "./configuration.js";
import type { MissionStore } from "./mission-store.js";
import type { DependencyResolver } from "./dependency-resolver.js";
import type {
  IntegrationHandshake,
  MissionRuntimeReport,
  MsrDiagnosticsSnapshot,
  Q1004ConsumableContract,
} from "./types.js";

export class ReportBuilder {
  buildQ1004ConsumableContract(config: MissionRuntimeConfiguration): Q1004ConsumableContract {
    return {
      contractId: "msr-q1004-contract-v1",
      contractVersion: MSR_METADATA_VERSION,
      producedBy: "mission-runtime",
      missionId: "Q10-03",
      consumerMissionId: "Q10-04",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "missionId",
        "missionType",
        "currentStatus",
        "executionTimeline",
        "progress",
        "activeWorkers",
        "dependencies",
        "checkpoints",
        "retryHistory",
        "recoveryHistory",
        "failureSummary",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      lifecycleStateCatalog: [...MISSION_LIFECYCLE_STATES],
      missionTypeCatalog: [...MISSION_TYPES],
      notes: [
        "Structural contract for Q10-04 Workflow Runtime — mission lifecycle records only",
        "Mission Runtime never replaces worker or orchestration logic",
      ],
      neverImplementQ1004OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: MissionStore, handshakes: IntegrationHandshake[]): MsrDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextMsrId("msr-diag"),
      timestamp: new Date().toISOString(),
      totalMissions: history.missions.length,
      totalTransitions: history.transitions.length,
      totalCheckpoints: history.checkpoints.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed mission evidence only",
        `Capabilities: ${MSR_CAPABILITIES.length}`,
      ],
    };
  }

  buildMissionRuntimeReport(
    store: MissionStore,
    dependencyResolver: DependencyResolver,
    config: MissionRuntimeConfiguration,
    missionId: string,
    params: {
      auditStatus: MissionRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): MissionRuntimeReport | null {
    const mission = store.getMission(missionId);
    if (!mission) return null;

    const transitions = store.listTransitions(missionId);
    const timeline = transitions.map((t) => ({
      entryId: t.transitionId,
      timestamp: t.timestamp,
      label: `${t.fromState}→${t.toState}`,
      state: t.toState,
      notes: [t.reason],
    }));

    const hasFailure = mission.currentStatus === "Failed";
    const checkpoints = store.listCheckpoints(missionId);
    const retries = store.listRetries(missionId);
    const recoveries = store.listRecoveries(missionId);

    return {
      reportId: nextMsrId("msr-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: MSR_RUNTIME_VERSION,
      missionId: mission.missionId,
      missionType: mission.missionType,
      currentStatus: mission.currentStatus,
      executionTimeline: timeline,
      progress: mission.progress,
      activeWorkers: [...mission.workers],
      dependencies: dependencyResolver.resolve(store, mission),
      checkpoints,
      retryHistory: retries,
      recoveryHistory: recoveries,
      failureSummary: hasFailure ? "Mission reached Failed state" : null,
      supportingEvidence: [...params.supportingEvidence, "config/mission-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: MSR_METADATA_VERSION,
      reportVersion: MSR_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1004: true,
      neverReplaceWorkerLogic: true,
      neverReplaceOrchestrationLogic: true,
      neverExecuteUnauthorisedMissions: true,
      neverFabricateMissionState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1004OrLater: true,
      preserveCompleteTraceability: true,
      preserveMissionHistory: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}
