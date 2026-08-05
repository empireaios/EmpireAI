import {
  EXECUTION_STATUSES,
  INVOCATION_KINDS,
  ORCHESTRATION_SERVICES,
  POR_CAPABILITIES,
  POR_METADATA_VERSION,
  POR_REPORT_VERSION,
  POR_RUNTIME_VERSION,
} from "./paths.js";
import { nextPorId } from "./orchestration-store.js";
import type { PillowOrchestrationRuntimeConfiguration } from "./configuration.js";
import type { OrchestrationStore } from "./orchestration-store.js";
import type {
  IntegrationHandshake,
  OrchestrationReport,
  PorDiagnosticsSnapshot,
  Q1003ConsumableContract,
} from "./types.js";

export class ReportBuilder {
  buildQ1003ConsumableContract(config: PillowOrchestrationRuntimeConfiguration): Q1003ConsumableContract {
    return {
      contractId: "por-q1003-contract-v1",
      contractVersion: POR_METADATA_VERSION,
      producedBy: "pillow-orchestration-runtime",
      missionId: "Q10-02",
      consumerMissionId: "Q10-03",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "sessionId",
        "requestId",
        "invokedWorkers",
        "invokedTools",
        "invokedWorkflows",
        "approvalActions",
        "reportsGenerated",
        "executionTimeline",
        "runtimeState",
        "successFailureStatus",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      orchestrationServiceCatalog: [...config.orchestrationServices],
      invocationKindCatalog: [...INVOCATION_KINDS],
      executionStatusCatalog: [...EXECUTION_STATUSES],
      notes: [
        "Structural contract for Q10-03 Mission Runtime — orchestration records only",
        "Pillow Orchestration Runtime never replaces worker or tool implementations",
      ],
      neverImplementQ1003OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: OrchestrationStore, handshakes: IntegrationHandshake[]): PorDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextPorId("por-diag"),
      timestamp: new Date().toISOString(),
      totalSessions: history.sessions.length,
      totalInvocations: history.results.length,
      totalEvents: history.events.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed orchestration evidence only",
        `Capabilities: ${POR_CAPABILITIES.length}`,
      ],
    };
  }

  buildOrchestrationReport(
    store: OrchestrationStore,
    config: PillowOrchestrationRuntimeConfiguration,
    params: {
      sessionId: string;
      requestId: string;
      runtimeState: string;
      handshakes: IntegrationHandshake[];
      auditStatus: OrchestrationReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): OrchestrationReport {
    const history = store.getHistory();
    const workerResults = history.results.filter((r) => r.kind === "worker");
    const toolResults = history.results.filter((r) => r.kind === "tool");
    const workflowResults = history.results.filter((r) => r.kind === "workflow");
    const reportResults = history.results.filter((r) => r.kind === "report");
    const hasFailure = history.results.some((r) => r.status === "failed" || r.status === "blocked");
    const hasSuccess = history.results.some((r) => r.status === "succeeded");
    const successFailureStatus: OrchestrationReport["successFailureStatus"] = hasFailure
      ? hasSuccess
        ? "partial"
        : "failure"
      : "success";

    return {
      reportId: nextPorId("por-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: POR_RUNTIME_VERSION,
      sessionId: params.sessionId,
      requestId: params.requestId,
      invokedWorkers: workerResults,
      invokedTools: toolResults,
      invokedWorkflows: workflowResults,
      approvalActions: history.approvalActions,
      reportsGenerated: reportResults,
      executionTimeline: history.events,
      runtimeState: params.runtimeState,
      successFailureStatus,
      supportingEvidence: [...params.supportingEvidence, "config/pillow-orchestration-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: POR_METADATA_VERSION,
      reportVersion: POR_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1003: true,
      neverReplaceWorkerImplementations: true,
      neverReplaceToolImplementations: true,
      neverExecuteUnauthorisedActions: true,
      neverFabricateExecutionResults: true,
      neverBypassApprovalRuntime: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1003OrLater: true,
      preserveCompleteTraceability: true,
      preserveOrchestrationHistory: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}
