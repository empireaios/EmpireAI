import {
  GOVERNANCE_CLASSES,
  MEMRT_CAPABILITIES,
  MEMRT_METADATA_VERSION,
  MEMRT_REPORT_VERSION,
  MEMRT_RUNTIME_VERSION,
  MEMORY_TYPES,
} from "./paths.js";
import { nextMemrtId } from "./memory-store.js";
import type { MemoryRuntimeConfiguration } from "./configuration.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { MemoryStore } from "./memory-store.js";
import type {
  IntegrationHandshake,
  MemrtDiagnosticsSnapshot,
  MemoryRuntimeReport,
  Q1006ConsumableContract,
} from "./types.js";

export class ReportBuilder {
  buildQ1006ConsumableContract(config: MemoryRuntimeConfiguration): Q1006ConsumableContract {
    return {
      contractId: "memrt-q1006-contract-v1",
      contractVersion: MEMRT_METADATA_VERSION,
      producedBy: "memory-runtime",
      missionId: "Q10-05",
      consumerMissionId: "Q10-06",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "memoryInventory",
        "activeContexts",
        "decisionHistorySummary",
        "previousResultSummary",
        "retrievalStatistics",
        "versionSummary",
        "memoryHealth",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      memoryTypeCatalog: [...MEMORY_TYPES],
      governanceClassCatalog: [...GOVERNANCE_CLASSES],
      notes: [
        "Structural contract for Q10-06 API Runtime — operational memory records only",
        "Memory Runtime never fabricates memory or replaces EKLS/application databases",
      ],
      neverImplementQ1006OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: MemoryStore, handshakes: IntegrationHandshake[]): MemrtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextMemrtId("memrt-diag"),
      timestamp: new Date().toISOString(),
      totalEntries: history.entries.length,
      totalVersions: history.entries.reduce((sum, e) => sum + e.versions.length, 0),
      totalQueries: history.retrievals.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed memory evidence only",
        `Capabilities: ${MEMRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildMemoryRuntimeReport(
    store: MemoryStore,
    metricsCollector: MetricsCollector,
    config: MemoryRuntimeConfiguration,
    params: {
      auditStatus: MemoryRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): MemoryRuntimeReport {
    return {
      reportId: nextMemrtId("memrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: MEMRT_RUNTIME_VERSION,
      memoryInventory: store.listEntries(),
      activeContexts: store.listContextBundles(),
      decisionHistorySummary: metricsCollector.buildDecisionHistorySummary(store),
      previousResultSummary: metricsCollector.buildPreviousResultSummary(store),
      retrievalStatistics: metricsCollector.buildRetrievalStatistics(store),
      versionSummary: metricsCollector.buildVersionSummary(store),
      memoryHealth: metricsCollector.buildHealth(store),
      supportingEvidence: [...params.supportingEvidence, "config/memory-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: MEMRT_METADATA_VERSION,
      reportVersion: MEMRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1006: true,
      neverReplaceEkls: true,
      neverReplaceApplicationDatabases: true,
      neverModifyHistoricalRecords: true,
      neverFabricateMemory: true,
      neverSilentlyOverwriteHistoricalDecisions: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1006OrLater: true,
      preserveCompleteTraceability: true,
      preserveHistoricalMemory: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      deterministicRetrievalOnly: true,
    };
  }
}
