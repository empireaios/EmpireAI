import {
  ALERT_SEVERITIES,
  COMPONENT_TYPES,
  HEALTH_STATUSES,
  MONRT_CAPABILITIES,
  MONRT_METADATA_VERSION,
  MONRT_REPORT_VERSION,
  MONRT_RUNTIME_VERSION,
} from "./paths.js";
import { nextMonrtId } from "./monitoring-store.js";
import type { MonitoringRuntimeConfiguration } from "./configuration.js";
import type { MonitoringStore } from "./monitoring-store.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { EnterpriseHealthAggregator } from "./enterprise-health-aggregator.js";
import type { WorkerMonitor } from "./worker-monitor.js";
import type { FactoryMonitor } from "./factory-monitor.js";
import type { RuntimeMonitor } from "./runtime-monitor.js";
import type { ApiMonitor } from "./api-monitor.js";
import type { QueueMonitor } from "./queue-monitor.js";
import type { MissionMonitor } from "./mission-monitor.js";
import type { ToolMonitor } from "./tool-monitor.js";
import type {
  IntegrationHandshake,
  MonitoringRuntimeReport,
  MonrtDiagnosticsSnapshot,
  Q1011ConsumableContract,
} from "./types.js";

const SECRET_FIELD_KEYS = [
  "apiKey",
  "api_key",
  "password",
  "secret",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "credentials",
  "credential",
  "privateKey",
];

export class ReportBuilder {
  buildQ1011ConsumableContract(
    _config: MonitoringRuntimeConfiguration,
  ): Q1011ConsumableContract {
    return {
      contractId: "monrt-q1011-contract-v1",
      contractVersion: MONRT_METADATA_VERSION,
      producedBy: "monitoring-runtime",
      missionId: "Q10-10",
      consumerMissionId: "Q10-11",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "enterpriseHealthSummary",
        "workerHealth",
        "factoryHealth",
        "runtimeHealth",
        "apiHealth",
        "queueHealth",
        "missionHealth",
        "toolHealth",
        "activeAlerts",
        "criticalEvents",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      componentTypeCatalog: [...COMPONENT_TYPES],
      healthStatusCatalog: [...HEALTH_STATUSES],
      alertSeverityCatalog: [...ALERT_SEVERITIES],
      notes: [
        "Structural contract for Q10-11 Recovery Runtime — monitoring evidence only",
        "Monitoring Runtime never fabricates health or suppresses critical alerts",
        "neverImplementQ1011OrLater remains locked — this module does not implement Recovery Runtime",
        "Recovery / workerRecoverySystem integrations are presence probes only",
      ],
      neverImplementQ1011OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: MonitoringStore,
    handshakes: IntegrationHandshake[],
  ): MonrtDiagnosticsSnapshot {
    const history = store.getHistory();
    const criticalAlertCount = store.listCriticalAlerts().length;
    return {
      diagnosticsId: nextMonrtId("monrt-diag"),
      timestamp: new Date().toISOString(),
      totalComponents: history.components.length,
      totalHeartbeats: history.heartbeats.length,
      totalAlerts: history.alerts.length,
      totalAnomalies: history.anomalies.length,
      totalReports: history.reports.length,
      criticalAlertCount,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed monitoring runtime evidence only",
        `Capabilities: ${MONRT_CAPABILITIES.length}`,
        "Critical alerts retained in history — never suppressed",
      ],
    };
  }

  buildMonitoringRuntimeReport(
    store: MonitoringStore,
    metricsCollector: MetricsCollector,
    aggregator: EnterpriseHealthAggregator,
    monitors: {
      worker: WorkerMonitor;
      factory: FactoryMonitor;
      runtime: RuntimeMonitor;
      api: ApiMonitor;
      queue: QueueMonitor;
      mission: MissionMonitor;
      tool: ToolMonitor;
    },
    config: MonitoringRuntimeConfiguration,
    params: {
      auditStatus: MonitoringRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): MonitoringRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const workerHealth = monitors.worker.monitor(store);
    const factoryHealth = monitors.factory.monitor(store);
    const runtimeHealth = monitors.runtime.monitor(store);
    const apiHealth = monitors.api.monitor(store);
    const queueHealth = monitors.queue.monitor(store);
    const missionHealth = monitors.mission.monitor(store);
    const toolHealth = monitors.tool.monitor(store);

    const enterpriseHealthSummary = aggregator.aggregate([
      workerHealth,
      factoryHealth,
      runtimeHealth,
      apiHealth,
      queueHealth,
      missionHealth,
      toolHealth,
    ]);

    // Critical alerts ALWAYS retained in report — never omitted.
    const activeAlerts = store.listAlerts().filter((a) => !a.acknowledged);
    const criticalEvents = store.listCriticalAlerts();

    const report: MonitoringRuntimeReport = {
      reportId: nextMonrtId("monrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: MONRT_RUNTIME_VERSION,
      enterpriseHealthSummary,
      workerHealth,
      factoryHealth,
      runtimeHealth,
      apiHealth,
      queueHealth,
      missionHealth,
      toolHealth,
      activeAlerts,
      criticalEvents,
      supportingEvidence: [
        ...params.supportingEvidence,
        "config/monitoring-runtime.config.json",
        `metrics:components=${metrics.totalComponents}`,
        `metrics:criticalAlerts=${metrics.criticalAlertCount}`,
      ],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: MONRT_METADATA_VERSION,
      reportVersion: MONRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1011: true,
      neverFabricateHealthInformation: true,
      neverSuppressCriticalAlerts: true,
      neverReplaceRecoverySystems: true,
      neverAutomaticallyRepairFailures: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1011OrLater: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverExecuteBusinessLogic: true,
      preserveCompleteTraceability: true,
      preserveMonitoringHistory: true,
      preserveAuditHistory: true,
      deterministicHealthCalculations: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };

    return this.stripSecretLikeFields(report);
  }

  stripSecretLikeFields<T>(value: T): T {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.stripSecretLikeFields(item)) as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_FIELD_KEYS.includes(key)) continue;
      if (key === "auditReference" || key === "messageRef") {
        result[key] =
          typeof nested === "string" &&
          (nested.startsWith("audit://") || nested.startsWith("msg://") || nested === null)
            ? nested
            : typeof nested === "string"
              ? nested.startsWith("audit://") || nested.startsWith("msg://")
                ? nested
                : "[REDACTED]"
              : nested;
        continue;
      }
      result[key] = this.stripSecretLikeFields(nested);
    }
    return result as T;
  }
}
