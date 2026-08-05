import {
  FAILURE_CLASSIFICATIONS,
  RECRT_CAPABILITIES,
  RECRT_METADATA_VERSION,
  RECRT_REPORT_VERSION,
  RECRT_RUNTIME_VERSION,
  RECOVERY_STATUSES,
  RECOVERY_STRATEGIES,
} from "./paths.js";
import { nextRecrtId } from "./recovery-store.js";
import type { RecoveryRuntimeConfiguration } from "./configuration.js";
import type { RecoveryStore } from "./recovery-store.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type {
  IntegrationHandshake,
  Q1012ConsumableContract,
  RecrtDiagnosticsSnapshot,
  RecoveryRuntimeReport,
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
  "businessPayload",
];

export class ReportBuilder {
  buildQ1012ConsumableContract(
    _config: RecoveryRuntimeConfiguration,
  ): Q1012ConsumableContract {
    return {
      contractId: "recrt-q1012-contract-v1",
      contractVersion: RECRT_METADATA_VERSION,
      producedBy: "recovery-runtime",
      missionId: "Q10-11",
      consumerMissionId: "Q10-12",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "recoverySummary",
        "activeRecoveries",
        "completedRecoveries",
        "failedRecoveries",
        "restartSummary",
        "rollbackSummary",
        "escalationSummary",
        "recoveryMetrics",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      failureClassificationCatalog: [...FAILURE_CLASSIFICATIONS],
      recoveryStrategyCatalog: [...RECOVERY_STRATEGIES],
      recoveryStatusCatalog: [...RECOVERY_STATUSES],
      notes: [
        "Structural contract for Q10-12 Scheduling Runtime — recovery evidence only",
        "Recovery Runtime never fabricates recovery success",
        "neverImplementQ1012OrLater remains locked — this module does not implement Scheduling Runtime",
        "workerRecoverySystem / recovery integrations are presence probes only",
      ],
      neverImplementQ1012OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: RecoveryStore,
    handshakes: IntegrationHandshake[],
  ): RecrtDiagnosticsSnapshot {
    const metrics = {
      totalFailures: store.listFailures().length,
      totalRecoveries: store.listCases().length,
      totalCheckpoints: store.listCheckpoints().length,
      totalRestarts: store.listRestarts().length,
      totalRollbacks: store.listRollbacks().length,
      totalEscalations: store.listEscalations().length,
      totalReports: store.listReports().length,
      activeRecoveries: store
        .listCases()
        .filter((c) =>
          [
            "detected",
            "classified",
            "restoring",
            "restarting",
            "rolling_back",
            "resumed",
            "awaiting_approval",
          ].includes(c.recoveryStatus),
        ).length,
    };
    return {
      diagnosticsId: nextRecrtId("recrt-diag"),
      timestamp: new Date().toISOString(),
      ...metrics,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from recorded recovery runtime evidence only",
        `Capabilities: ${RECRT_CAPABILITIES.length}`,
        "Never fabricates recovery success — completed only after structural steps",
      ],
    };
  }

  buildRecoveryRuntimeReport(
    store: RecoveryStore,
    metricsCollector: MetricsCollector,
    config: RecoveryRuntimeConfiguration,
    params: {
      auditStatus: RecoveryRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): RecoveryRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const cases = store.listCases();
    const activeStatuses = new Set([
      "detected",
      "classified",
      "restoring",
      "restarting",
      "rolling_back",
      "resumed",
      "awaiting_approval",
    ]);

    // Never report fabricated success — completed only if status is completed with evidence.
    const activeRecoveries = cases.filter((c) => activeStatuses.has(c.recoveryStatus));
    const completedRecoveries = cases.filter(
      (c) =>
        c.recoveryStatus === "completed" &&
        c.fabricated === false &&
        c.supportingEvidence.some((e) =>
          /(_completed|restart_completed|restore_completed|rollback_completed|resume_structural)/.test(
            e,
          ),
        ),
    );
    const failedRecoveries = cases.filter(
      (c) =>
        c.recoveryStatus === "failed" ||
        c.recoveryStatus === "escalated" ||
        c.recoveryStatus === "cancelled",
    );

    const restarts = store.listRestarts();
    const rollbacks = store.listRollbacks();
    const escalations = store.listEscalations();

    const report: RecoveryRuntimeReport = {
      reportId: nextRecrtId("recrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: RECRT_RUNTIME_VERSION,
      recoverySummary: {
        totalFailures: metrics.totalFailures,
        totalRecoveries: metrics.totalRecoveries,
        activeCount: activeRecoveries.length,
        completedCount: completedRecoveries.length,
        failedCount: failedRecoveries.length,
        escalatedCount: cases.filter((c) => c.recoveryStatus === "escalated").length,
        awaitingApprovalCount: cases.filter((c) => c.recoveryStatus === "awaiting_approval")
          .length,
        supportingEvidence: [
          `metrics:failures=${metrics.totalFailures}`,
          `metrics:recoveries=${metrics.totalRecoveries}`,
        ],
        fabricated: false,
        structuralSignalOnly: true,
      },
      activeRecoveries,
      completedRecoveries,
      failedRecoveries,
      restartSummary: {
        totalRestarts: restarts.length,
        successfulRestarts: restarts.filter((r) => r.status === "restarted").length,
        failedRestarts: restarts.filter(
          (r) => r.status === "failed" || r.status === "max_exceeded",
        ).length,
        maxExceededCount: restarts.filter((r) => r.status === "max_exceeded").length,
        supportingEvidence: [`restarts=${restarts.length}`],
        fabricated: false,
        structuralSignalOnly: true,
      },
      rollbackSummary: {
        totalRollbacks: rollbacks.length,
        completedRollbacks: rollbacks.filter((r) => r.rollbackStatus === "completed").length,
        failedRollbacks: rollbacks.filter((r) => r.rollbackStatus === "failed").length,
        supportingEvidence: [`rollbacks=${rollbacks.length}`],
        fabricated: false,
        structuralSignalOnly: true,
      },
      escalationSummary: {
        totalEscalations: escalations.length,
        pendingCount: escalations.filter((e) => e.escalationStatus === "pending").length,
        escalatedCount: escalations.filter((e) => e.escalationStatus === "escalated").length,
        acknowledgedCount: escalations.filter((e) => e.escalationStatus === "acknowledged")
          .length,
        supportingEvidence: [`escalations=${escalations.length}`],
        fabricated: false,
        structuralSignalOnly: true,
      },
      recoveryMetrics: metrics,
      supportingEvidence: [
        ...params.supportingEvidence,
        "config/recovery-runtime.config.json",
        `metrics:active=${metrics.activeRecoveries}`,
        `metrics:completed=${metrics.completedRecoveries}`,
      ],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: RECRT_METADATA_VERSION,
      reportVersion: RECRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1012: true,
      neverFabricateRecoverySuccess: true,
      neverLoseRecoverableExecutionState: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverModifyValidatedBusinessData: true,
      neverReplaceBusinessLogic: true,
      neverImplementQ1012OrLater: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveRecoveryHistory: true,
      preserveAuditHistory: true,
      deterministicRecoveryBehaviour: true,
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
      if (
        key === "auditReference" ||
        key === "checkpointRef" ||
        key === "stateRef" ||
        key === "reasonRef"
      ) {
        result[key] =
          typeof nested === "string" &&
          (nested.startsWith("audit://") ||
            nested.startsWith("msg://") ||
            nested.startsWith("ckpt://") ||
            nested.startsWith("state://") ||
            nested === null)
            ? nested
            : typeof nested === "string"
              ? nested.startsWith("audit://") ||
                nested.startsWith("msg://") ||
                nested.startsWith("ckpt://") ||
                nested.startsWith("state://")
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
