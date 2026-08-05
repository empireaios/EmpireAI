import {
  CHANNEL_TYPES,
  COMRT_CAPABILITIES,
  COMRT_METADATA_VERSION,
  COMRT_REPORT_VERSION,
  COMRT_RUNTIME_VERSION,
  DELIVERY_STATUSES,
  MESSAGE_TYPES,
} from "./paths.js";
import { nextComrtId } from "./communication-store.js";
import type { CommunicationRuntimeConfiguration } from "./configuration.js";
import type { CommunicationStore } from "./communication-store.js";
import type { HealthMonitor } from "./health-monitor.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type {
  CommunicationRuntimeReport,
  IntegrationHandshake,
  ComrtDiagnosticsSnapshot,
  Q1009ConsumableContract,
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
  buildQ1009ConsumableContract(
    _config: CommunicationRuntimeConfiguration,
  ): Q1009ConsumableContract {
    return {
      contractId: "comrt-q1009-contract-v1",
      contractVersion: COMRT_METADATA_VERSION,
      producedBy: "communication-runtime",
      missionId: "Q10-08",
      consumerMissionId: "Q10-09",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "activeCommunicationChannels",
        "messageStatistics",
        "deliverySummary",
        "retrySummary",
        "failedDeliveries",
        "collaborationSessions",
        "runtimeHealth",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      messageTypeCatalog: [...MESSAGE_TYPES],
      channelTypeCatalog: [...CHANNEL_TYPES],
      deliveryStatusCatalog: [...DELIVERY_STATUSES],
      notes: [
        "Structural contract for Q10-09 Approval Runtime — channel/message/delivery evidence only",
        "Communication Runtime never fabricates messages or loses acknowledged history",
        "neverImplementQ1009OrLater remains locked — this module does not implement Approval Runtime",
      ],
      neverImplementQ1009OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: CommunicationStore,
    handshakes: IntegrationHandshake[],
  ): ComrtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextComrtId("comrt-diag"),
      timestamp: new Date().toISOString(),
      totalChannels: history.channels.length,
      totalMessages: history.messages.length,
      totalSessions: history.sessions.length,
      totalDeliveries: history.deliveries.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed communication runtime evidence only",
        `Capabilities: ${COMRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildCommunicationRuntimeReport(
    store: CommunicationStore,
    metricsCollector: MetricsCollector,
    healthMonitor: HealthMonitor,
    config: CommunicationRuntimeConfiguration,
    params: {
      auditStatus: CommunicationRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): CommunicationRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const runtimeHealth = healthMonitor.assess(store, metricsCollector);

    const report: CommunicationRuntimeReport = {
      reportId: nextComrtId("comrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: COMRT_RUNTIME_VERSION,
      activeCommunicationChannels: store.listActiveChannels(),
      messageStatistics: metricsCollector.buildMessageStatistics(store),
      deliverySummary: metricsCollector.buildDeliverySummary(store),
      retrySummary: metricsCollector.buildRetrySummary(store),
      failedDeliveries: store.listFailedDeliveries(),
      collaborationSessions: store.listSessions(),
      runtimeHealth,
      supportingEvidence: [
        ...params.supportingEvidence,
        "config/communication-runtime.config.json",
      ],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: COMRT_METADATA_VERSION,
      reportVersion: COMRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1009: true,
      neverFabricateMessages: true,
      neverLoseAcknowledgedMessages: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ1009OrLater: true,
      neverExecuteBusinessLogic: true,
      neverReplaceWorkerImplementations: true,
      neverReplaceOrchestrationLogic: true,
      deterministicMessageRouting: true,
      preserveCompleteTraceability: true,
      preserveCommunicationHistory: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };

    void metrics;
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
      if (key === "contextReference" || key === "auditReference") {
        result[key] =
          typeof nested === "string" &&
          (nested.startsWith("ctx://") || nested.startsWith("audit://"))
            ? nested
            : "[REDACTED]";
        continue;
      }
      result[key] = this.stripSecretLikeFields(nested);
    }
    return result as T;
  }
}
