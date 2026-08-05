import {
  AUTH_METHODS,
  TOOL_CATEGORIES,
  TOOLRT_CAPABILITIES,
  TOOLRT_METADATA_VERSION,
  TOOLRT_REPORT_VERSION,
  TOOLRT_RUNTIME_VERSION,
} from "./paths.js";
import { nextToolrtId } from "./tool-store.js";
import type { ToolRuntimeConfiguration } from "./configuration.js";
import type { AvailabilityMonitor } from "./availability-monitor.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { ToolStore } from "./tool-store.js";
import type {
  IntegrationHandshake,
  Q1008ConsumableContract,
  ToolrtDiagnosticsSnapshot,
  ToolRuntimeReport,
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
  buildQ1008ConsumableContract(_config: ToolRuntimeConfiguration): Q1008ConsumableContract {
    return {
      contractId: "toolrt-q1008-contract-v1",
      contractVersion: TOOLRT_METADATA_VERSION,
      producedBy: "tool-runtime",
      missionId: "Q10-07",
      consumerMissionId: "Q10-08",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "registeredTools",
        "toolCategories",
        "activeConnections",
        "invocationStatistics",
        "failureSummary",
        "retrySummary",
        "availabilityStatus",
        "permissionStatus",
        "diagnostics",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      toolCategoryCatalog: [...TOOL_CATEGORIES],
      authMethodCatalog: [...AUTH_METHODS],
      notes: [
        "Structural contract for Q10-08 Communication Runtime — tool registrations and credential references only",
        "Tool Runtime never fabricates execution results or exposes secrets",
        "neverImplementQ1008OrLater remains locked — this module does not implement Communication Runtime",
      ],
      neverImplementQ1008OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: ToolStore, handshakes: IntegrationHandshake[]): ToolrtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextToolrtId("toolrt-diag"),
      timestamp: new Date().toISOString(),
      totalTools: history.tools.length,
      totalConnections: history.connections.length,
      totalInvocations: history.invocations.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed tool runtime evidence only",
        `Capabilities: ${TOOLRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildToolRuntimeReport(
    store: ToolStore,
    metricsCollector: MetricsCollector,
    availabilityMonitor: AvailabilityMonitor,
    config: ToolRuntimeConfiguration,
    params: {
      auditStatus: ToolRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): ToolRuntimeReport {
    const tools = store.listTools();
    const metrics = metricsCollector.collect(store);
    const categories = Array.from(new Set(tools.map((t) => t.toolCategory))).sort();

    const report: ToolRuntimeReport = {
      reportId: nextToolrtId("toolrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: TOOLRT_RUNTIME_VERSION,
      registeredTools: tools,
      toolCategories: categories,
      activeConnections: store.listActiveConnections(),
      invocationStatistics: metricsCollector.buildInvocationStatistics(store),
      failureSummary: metricsCollector.buildFailureSummary(store),
      retrySummary: metricsCollector.buildRetrySummary(store),
      availabilityStatus: availabilityMonitor.buildAvailabilitySummary(store),
      permissionStatus: metricsCollector.buildPermissionStatus(store),
      diagnostics: {
        registeredToolCount: metrics.totalTools,
        activeConnectionCount: metrics.activeConnections,
        unavailableToolCount: tools.filter((t) => t.availabilityStatus === "unavailable").length,
        notes: [
          "Structural tool diagnostics only — no fabricated execution payloads",
          "credentialReference strings only; secrets never included",
        ],
      },
      supportingEvidence: [...params.supportingEvidence, "config/tool-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: TOOLRT_METADATA_VERSION,
      reportVersion: TOOLRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1008: true,
      neverExposeSecrets: true,
      neverExposeCredentials: true,
      neverFabricateExecutionResults: true,
      neverInvokeUnauthorizedTools: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1008OrLater: true,
      deterministicToolRoutingOnly: true,
      preserveCompleteTraceability: true,
      preserveInvocationTraces: true,
      preserveAuditHistory: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      credentialReferenceOnly: true,
    };

    return this.stripSecretLikeFields(report);
  }

  /** Strip any secret-like fields from report payloads. */
  stripSecretLikeFields<T>(value: T): T {
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) {
      return value.map((item) => this.stripSecretLikeFields(item)) as T;
    }
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_FIELD_KEYS.includes(key)) continue;
      if (key === "credentialReference" || key === "refreshTokenReference") {
        result[key] = typeof nested === "string" && nested.startsWith("cred://") ? nested : "[REDACTED]";
        continue;
      }
      result[key] = this.stripSecretLikeFields(nested);
    }
    return result as T;
  }
}
