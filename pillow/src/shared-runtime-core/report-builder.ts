import {
  SHARED_RUNTIME_REPORT_VERSION,
  SHARED_RUNTIME_VERSION,
  SRTC_CAPABILITIES,
  SRTC_METADATA_VERSION,
} from "./paths.js";
import { nextSrtcId } from "./runtime-store.js";
import type { SharedRuntimeCoreConfiguration } from "./configuration.js";
import type { RuntimeStore } from "./runtime-store.js";
import type {
  DependencyStatus,
  IntegrationHandshake,
  Q1002ConsumableContract,
  RuntimeDiagnosticsSnapshot,
  RuntimeTopology,
  SharedRuntimeReport,
} from "./types.js";

export class ReportBuilder {
  buildQ1002ConsumableContract(config: SharedRuntimeCoreConfiguration): Q1002ConsumableContract {
    return {
      contractId: "srtc-q1002-contract-v1",
      contractVersion: SRTC_METADATA_VERSION,
      producedBy: "shared-runtime-core",
      missionId: "Q10-01",
      consumerMissionId: "Q10-02",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "registeredFactories",
        "registeredWorkers",
        "runtimeServices",
        "activeRuntimeState",
        "dependencyStatus",
        "routingStatus",
        "healthStatus",
        "runtimeDiagnostics",
        "topology",
      ],
      runtimeServiceCatalog: [...config.runtimeServices],
      factoryKeyCatalog: config.defaultFactories.map((f) => f.factoryKey),
      lifecycleStatuses: ["disconnected", "connected", "active", "failed"],
      notes: [
        "Structural contract for Q10-02 Pillow Orchestration Runtime — routing records only",
        "Shared Runtime Core never replaces factory or worker business logic",
      ],
      neverImplementQ1002OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: RuntimeStore,
    handshakes: IntegrationHandshake[],
  ): RuntimeDiagnosticsSnapshot {
    return {
      diagnosticsId: nextSrtcId("srtc-diag"),
      timestamp: new Date().toISOString(),
      totalFactories: store.listFactories().length,
      totalWorkers: store.listWorkers().length,
      totalServices: store.listServices().length,
      totalRoutes: store.listRoutes().length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed registrations and dependency probes only",
        `Capabilities: ${SRTC_CAPABILITIES.length}`,
      ],
    };
  }

  buildTopology(store: RuntimeStore, dependencyStatus: DependencyStatus[]): RuntimeTopology {
    return {
      topologyId: nextSrtcId("srtc-topology"),
      timestamp: new Date().toISOString(),
      factories: store.listFactories().map((f) => ({
        factoryKey: f.factoryKey,
        factoryName: f.factoryName,
        series: f.series,
        healthStatus: String(f.healthStatus),
      })),
      workers: store.listWorkers().map((w) => ({
        workerId: w.workerId,
        workerName: w.workerName,
        factoryKey: w.factoryKey,
        healthStatus: String(w.healthStatus),
      })),
      services: store.listServices().map((s) => ({
        serviceName: String(s.serviceName),
        status: String(s.status),
      })),
      routes: store.listRoutes().map((r) => ({
        sourceFactory: r.sourceFactory,
        targetFactory: r.targetFactory,
        service: r.service,
        routingStatus: String(r.routingStatus),
      })),
      dependencies: dependencyStatus.map((d) => ({ ...d, notes: [...d.notes] })),
    };
  }

  buildSharedRuntimeReport(
    store: RuntimeStore,
    config: SharedRuntimeCoreConfiguration,
    params: {
      dependencyStatus: DependencyStatus[];
      handshakes: IntegrationHandshake[];
      healthStatus: string;
      routingStatus: string;
      activeRuntimeState: string;
      auditStatus: SharedRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): SharedRuntimeReport {
    const diagnostics = this.buildDiagnostics(store, params.handshakes);
    return {
      reportId: nextSrtcId("srtc-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: SHARED_RUNTIME_VERSION,
      registeredFactories: store.listFactories(),
      registeredWorkers: store.listWorkers(),
      runtimeServices: store.listServices(),
      activeRuntimeState: params.activeRuntimeState,
      dependencyStatus: params.dependencyStatus,
      routingStatus: params.routingStatus,
      healthStatus: params.healthStatus,
      runtimeDiagnostics: diagnostics,
      supportingEvidence: [...params.supportingEvidence],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: SRTC_METADATA_VERSION,
      reportVersion: SHARED_RUNTIME_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1002: true,
      neverReplaceFactoryLogic: true,
      neverReplaceWorkerLogic: true,
      neverExecuteBusinessSpecificDecisions: true,
      neverFabricateRuntimeState: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1002OrLater: true,
      preserveCompleteTraceability: true,
      preserveRuntimeHistory: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }
}
