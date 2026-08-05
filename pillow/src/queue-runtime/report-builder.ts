import {
  JOB_STATUSES,
  QUEUE_TYPES,
  QRT_CAPABILITIES,
  QRT_METADATA_VERSION,
  QRT_REPORT_VERSION,
  QRT_RUNTIME_VERSION,
} from "./paths.js";
import { nextQrtId } from "./queue-store.js";
import type { QueueRuntimeConfiguration } from "./configuration.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { QueueManagerCore } from "./queue-manager-core.js";
import type { QueueStore } from "./queue-store.js";
import type {
  IntegrationHandshake,
  Q1005ConsumableContract,
  QrtDiagnosticsSnapshot,
  QueueRuntimeReport,
} from "./types.js";

export class ReportBuilder {
  buildQ1005ConsumableContract(config: QueueRuntimeConfiguration): Q1005ConsumableContract {
    return {
      contractId: "qrt-q1005-contract-v1",
      contractVersion: QRT_METADATA_VERSION,
      producedBy: "queue-runtime",
      missionId: "Q10-04",
      consumerMissionId: "Q10-05",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "queueInventory",
        "activeJobs",
        "waitingJobs",
        "runningJobs",
        "completedJobs",
        "failedJobs",
        "retrySummary",
        "dependencySummary",
        "queueHealth",
        "dispatchStatistics",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      queueTypeCatalog: [...QUEUE_TYPES],
      jobStatusCatalog: [...JOB_STATUSES],
      notes: [
        "Structural contract for Q10-05 Memory Runtime — queue management records only",
        "Queue Runtime never executes business-specific work",
      ],
      neverImplementQ1005OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: QueueStore, handshakes: IntegrationHandshake[]): QrtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextQrtId("qrt-diag"),
      timestamp: new Date().toISOString(),
      totalQueues: history.queues.length,
      totalJobs: history.jobs.length,
      totalDispatches: history.dispatches.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed queue evidence only",
        `Capabilities: ${QRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildQueueRuntimeReport(
    store: QueueStore,
    core: QueueManagerCore,
    metricsCollector: MetricsCollector,
    config: QueueRuntimeConfiguration,
    params: {
      auditStatus: QueueRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): QueueRuntimeReport {
    const jobs = store.listJobs();
    const dispatches = store.listDispatches();
    const dependencySummary = core.getDependencyResolver().summarize(store, jobs);
    const retrySummary = core.getRetryEngine().summarize(jobs);
    const queueHealth = metricsCollector.buildHealth(store);

    const highRiskDispatches = dispatches.filter((d) => d.highRisk).length;
    const lastDispatch = dispatches.at(-1);

    return {
      reportId: nextQrtId("qrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: QRT_RUNTIME_VERSION,
      queueInventory: store.listQueues(),
      activeJobs: jobs.filter((j) => ["queued", "ready", "scheduled", "deferred"].includes(j.status)),
      waitingJobs: jobs.filter((j) => j.status === "waiting_dependency"),
      runningJobs: jobs.filter((j) => ["dispatched", "running", "retrying"].includes(j.status)),
      completedJobs: jobs.filter((j) => j.status === "completed"),
      failedJobs: jobs.filter((j) => j.status === "failed" || j.status === "dead_lettered"),
      retrySummary,
      dependencySummary,
      queueHealth,
      dispatchStatistics: {
        totalDispatches: dispatches.length,
        lastDispatchAt: lastDispatch?.timestamp ?? null,
        highRiskDispatches,
      },
      supportingEvidence: [...params.supportingEvidence, "config/queue-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: QRT_METADATA_VERSION,
      reportVersion: QRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1005: true,
      neverReplaceWorkerLogic: true,
      neverReplaceMissionLogic: true,
      neverExecuteBusinessSpecificWork: true,
      neverFabricateQueueState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1005OrLater: true,
      preserveCompleteTraceability: true,
      preserveExecutionHistory: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      deterministicQueueOrdering: true,
    };
  }
}
