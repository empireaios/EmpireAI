import {
  APPROVAL_STATUSES,
  APPROVAL_TYPES,
  APVRT_CAPABILITIES,
  APVRT_METADATA_VERSION,
  APVRT_REPORT_VERSION,
  APVRT_RUNTIME_VERSION,
  POLICY_SCOPES,
} from "./paths.js";
import { nextApvrtId } from "./approval-store.js";
import type { ApprovalRuntimeConfiguration } from "./configuration.js";
import type { ApprovalStore } from "./approval-store.js";
import type { GovernanceSummaryBuilder } from "./governance-summary.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type {
  ApprovalRuntimeReport,
  ApvrtDiagnosticsSnapshot,
  IntegrationHandshake,
  Q1010ConsumableContract,
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
  buildQ1010ConsumableContract(
    _config: ApprovalRuntimeConfiguration,
  ): Q1010ConsumableContract {
    return {
      contractId: "apvrt-q1010-contract-v1",
      contractVersion: APVRT_METADATA_VERSION,
      producedBy: "approval-runtime",
      missionId: "Q10-09",
      consumerMissionId: "Q10-10",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "activeApprovalRequests",
        "pendingApprovals",
        "approvedRequests",
        "rejectedRequests",
        "escalatedRequests",
        "approvalTimelines",
        "governanceSummary",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      approvalTypeCatalog: [...APPROVAL_TYPES],
      approvalStatusCatalog: [...APPROVAL_STATUSES],
      policyScopeCatalog: [...POLICY_SCOPES],
      notes: [
        "Structural contract for Q10-10 Monitoring Runtime — approval evidence only",
        "Approval Runtime never fabricates decisions or auto-approves restricted actions",
        "neverImplementQ1010OrLater remains locked — this module does not implement Monitoring Runtime",
      ],
      neverImplementQ1010OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: ApprovalStore,
    handshakes: IntegrationHandshake[],
  ): ApvrtDiagnosticsSnapshot {
    const history = store.getHistory();
    return {
      diagnosticsId: nextApvrtId("apvrt-diag"),
      timestamp: new Date().toISOString(),
      totalPolicies: history.policies.length,
      totalRequests: history.requests.length,
      totalDecisions: history.decisions.length,
      totalReports: history.reports.length,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from observed approval runtime evidence only",
        `Capabilities: ${APVRT_CAPABILITIES.length}`,
      ],
    };
  }

  buildApprovalRuntimeReport(
    store: ApprovalStore,
    metricsCollector: MetricsCollector,
    governanceSummaryBuilder: GovernanceSummaryBuilder,
    config: ApprovalRuntimeConfiguration,
    params: {
      auditStatus: ApprovalRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): ApprovalRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const requests = store.listRequests();
    const pendingStatuses = new Set([
      "pending",
      "routed",
      "awaiting_pillow",
      "awaiting_grand_king",
      "delegated",
      "escalated",
    ]);

    const report: ApprovalRuntimeReport = {
      reportId: nextApvrtId("apvrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: APVRT_RUNTIME_VERSION,
      activeApprovalRequests: requests.filter((r) => pendingStatuses.has(r.currentStatus)),
      pendingApprovals: requests.filter((r) => pendingStatuses.has(r.currentStatus)),
      approvedRequests: requests.filter(
        (r) => r.currentStatus === "approved" || r.currentStatus === "resumed",
      ),
      rejectedRequests: requests.filter((r) => r.currentStatus === "rejected"),
      escalatedRequests: requests.filter(
        (r) => r.currentStatus === "escalated" || r.escalationHistory.length > 0,
      ),
      approvalTimelines: metricsCollector.buildApprovalTimelines(store),
      governanceSummary: governanceSummaryBuilder.build(store, metricsCollector),
      supportingEvidence: [
        ...params.supportingEvidence,
        "config/approval-runtime.config.json",
      ],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: APVRT_METADATA_VERSION,
      reportVersion: APVRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1010: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverFabricateApprovalDecisions: true,
      neverAutoApproveRestrictedActions: true,
      neverImplementQ1010OrLater: true,
      neverReplaceBusinessLogic: true,
      neverReplaceWorkerImplementations: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveApprovalHistory: true,
      preserveAuditHistory: true,
      preventUnauthorizedExecution: true,
      deterministicApprovalRouting: true,
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
      if (SECRET_FIELD_KEYS.includes(key) && key !== "resumeToken") continue;
      if (key === "auditReference" || key === "notesRef") {
        result[key] =
          typeof nested === "string" &&
          (nested.startsWith("audit://") || nested.startsWith("notes://") || nested === null)
            ? nested
            : typeof nested === "string"
              ? nested.startsWith("audit://") || nested.startsWith("notes://")
                ? nested
                : "[REDACTED]"
              : nested;
        continue;
      }
      if (key === "resumeToken") {
        result[key] =
          typeof nested === "string" && nested.startsWith("resume://")
            ? nested
            : nested == null
              ? null
              : "[REDACTED]";
        continue;
      }
      result[key] = this.stripSecretLikeFields(nested);
    }
    return result as T;
  }
}
