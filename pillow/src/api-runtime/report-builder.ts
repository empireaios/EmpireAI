import {
  APIRT_CAPABILITIES,
  APIRT_METADATA_VERSION,
  APIRT_REPORT_VERSION,
  APIRT_RUNTIME_VERSION,
  AUTH_METHODS,
  SERVICE_TYPES,
} from "./paths.js";
import { nextApirtId } from "./api-store.js";
import type { ApiRuntimeConfiguration } from "./configuration.js";
import type { HealthMonitor } from "./health-monitor.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type { ApiStore } from "./api-store.js";
import type {
  ApirtDiagnosticsSnapshot,
  ApiRuntimeReport,
  IntegrationHandshake,
  Q1007ConsumableContract,
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
  buildQ1007ConsumableContract(_config: ApiRuntimeConfiguration): Q1007ConsumableContract {
    return {
      contractId: "apirt-q1007-contract-v1",
      contractVersion: APIRT_METADATA_VERSION,
      producedBy: "api-runtime",
      missionId: "Q10-06",
      consumerMissionId: "Q10-07",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "registeredApis",
        "activeConnections",
        "providerHealth",
        "requestStatistics",
        "failureSummary",
        "retrySummary",
        "authenticationStatus",
        "rateLimitStatus",
        "apiDiagnostics",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      serviceTypeCatalog: [...SERVICE_TYPES],
      authMethodCatalog: [...AUTH_METHODS],
      notes: [
        "Structural contract for Q10-07 Tool Runtime — API routing and credential references only",
        "API Runtime never fabricates response bodies or exposes secrets",
        "neverImplementQ1007OrLater remains locked — this module does not implement Tool Runtime",
      ],
      neverImplementQ1007OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(store: ApiStore, handshakes: IntegrationHandshake[]): ApirtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextApirtId("apirt-diag"),
      timestamp: new Date().toISOString(),
      totalProviders: history.providers.length,
      totalConnections: history.connections.length,
      totalTraces: history.traces.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed API runtime evidence only",
        `Capabilities: ${APIRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildApiRuntimeReport(
    store: ApiStore,
    metricsCollector: MetricsCollector,
    healthMonitor: HealthMonitor,
    config: ApiRuntimeConfiguration,
    params: {
      auditStatus: ApiRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): ApiRuntimeReport {
    const providers = store.listProviders();
    const metrics = metricsCollector.collect(store);
    const report: ApiRuntimeReport = {
      reportId: nextApirtId("apirt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: APIRT_RUNTIME_VERSION,
      registeredApis: providers,
      activeConnections: store.listActiveConnections(),
      providerHealth: healthMonitor.assessAll(store),
      requestStatistics: metricsCollector.buildRequestStatistics(store),
      failureSummary: metricsCollector.buildFailureSummary(store),
      retrySummary: metricsCollector.buildRetrySummary(store),
      authenticationStatus: metricsCollector.buildAuthenticationStatus(store),
      rateLimitStatus: metricsCollector.buildRateLimitSummary(store),
      apiDiagnostics: {
        registeredProviderCount: metrics.totalProviders,
        activeConnectionCount: metrics.activeConnections,
        openCircuitCount: providers.filter((p) => p.circuitState === "open").length,
        rateLimitedProviderCount: providers.filter((p) => p.rateLimitStatus === "exceeded").length,
        notes: [
          "Structural API diagnostics only — no live response bodies fabricated",
          "credentialReference strings only; secrets never included",
        ],
      },
      supportingEvidence: [...params.supportingEvidence, "config/api-runtime.config.json"],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: APIRT_METADATA_VERSION,
      reportVersion: APIRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1007: true,
      neverExposeSecrets: true,
      neverExposeCredentials: true,
      neverFabricateApiResponses: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1007OrLater: true,
      preserveCompleteTraceability: true,
      preserveRequestTraces: true,
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
