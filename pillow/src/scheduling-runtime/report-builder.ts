import {
  SCHEDULE_STATUSES,
  SCHEDULE_TYPES,
  SCHRT_CAPABILITIES,
  SCHRT_METADATA_VERSION,
  SCHRT_REPORT_VERSION,
  SCHRT_RUNTIME_VERSION,
  TRIGGER_TYPES,
} from "./paths.js";
import { nextSchrtId } from "./schedule-store.js";
import type { SchedulingRuntimeConfiguration } from "./configuration.js";
import type { ScheduleStore } from "./schedule-store.js";
import type { MetricsCollector } from "./metrics-collector.js";
import type {
  IntegrationHandshake,
  Q1013ConsumableContract,
  SchrtDiagnosticsSnapshot,
  SchedulingRuntimeReport,
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
  buildQ1013ConsumableContract(
    _config: SchedulingRuntimeConfiguration,
  ): Q1013ConsumableContract {
    return {
      contractId: "schrt-q1013-contract-v1",
      contractVersion: SCHRT_METADATA_VERSION,
      producedBy: "scheduling-runtime",
      missionId: "Q10-12",
      consumerMissionId: "Q10-13",
      exposedFields: [
        "reportId",
        "runtimeVersion",
        "activeSchedules",
        "upcomingExecutions",
        "completedExecutions",
        "missedExecutions",
        "eventTriggers",
        "schedulingStatistics",
        "conflictSummary",
        "supportingEvidence",
        "auditStatus",
        "outstandingIssues",
        "confidenceScore",
      ],
      scheduleTypeCatalog: [...SCHEDULE_TYPES],
      triggerTypeCatalog: [...TRIGGER_TYPES],
      scheduleStatusCatalog: [...SCHEDULE_STATUSES],
      notes: [
        "Structural contract for Q10-13 Audit Runtime — scheduling evidence only",
        "Scheduling Runtime never fabricates execution times",
        "neverImplementQ1013OrLater remains locked — this module does not implement Audit Runtime",
        "Does not replace Queue Runtime or Mission Runtime — structural refs only",
      ],
      neverImplementQ1013OrLater: true,
      structuralSignalOnly: true,
    };
  }

  buildDiagnostics(
    store: ScheduleStore,
    handshakes: IntegrationHandshake[],
  ): SchrtDiagnosticsSnapshot {
    const metrics = {
      totalSchedules: store.listSchedules().length,
      totalExecutions: store.listExecutions().length,
      totalConflicts: store.listConflicts().length,
      totalEventTriggers: store.listEventTriggers().length,
      totalReports: store.listReports().length,
      activeSchedules: store
        .listSchedules()
        .filter((s) => !s.paused && (s.currentStatus === "active" || s.currentStatus === "draft"))
        .length,
    };
    return {
      diagnosticsId: nextSchrtId("schrt-diag"),
      timestamp: new Date().toISOString(),
      ...metrics,
      integrationHandshakes: handshakes.map((h) => ({ ...h, notes: [...h.notes] })),
      notes: [
        "Diagnostics from recorded scheduling runtime evidence only",
        `Capabilities: ${SCHRT_CAPABILITIES.length}`,
        "Never fabricates execution times — next/previous only from deterministic computation or recorded evidence",
      ],
    };
  }

  buildSchedulingRuntimeReport(
    store: ScheduleStore,
    metricsCollector: MetricsCollector,
    config: SchedulingRuntimeConfiguration,
    params: {
      auditStatus: SchedulingRuntimeReport["auditStatus"];
      outstandingIssues: string[];
      confidenceScore: number;
      supportingEvidence: string[];
    },
  ): SchedulingRuntimeReport {
    const metrics = metricsCollector.collect(store);
    const schedules = store.listSchedules();
    const executions = store.listExecutions();

    const activeSchedules = schedules.filter(
      (s) => !s.paused && (s.currentStatus === "active" || s.currentStatus === "draft"),
    );
    const upcomingExecutions = schedules
      .filter((s) => s.nextExecution != null && !s.paused && s.currentStatus !== "cancelled")
      .sort((a, b) => (a.nextExecution ?? "").localeCompare(b.nextExecution ?? ""));

    const completedExecutions = executions.filter(
      (e) => e.status === "completed" && e.fabricated === false,
    );
    const missedExecutions = executions.filter((e) => e.status === "missed");

    const report: SchedulingRuntimeReport = {
      reportId: nextSchrtId("schrt-rpt"),
      timestamp: new Date().toISOString(),
      runtimeVersion: SCHRT_RUNTIME_VERSION,
      activeSchedules,
      upcomingExecutions,
      completedExecutions,
      missedExecutions,
      eventTriggers: store.listEventTriggers(),
      schedulingStatistics: {
        totalSchedules: metrics.totalSchedules,
        activeCount: metrics.activeSchedules,
        pausedCount: schedules.filter((s) => s.paused || s.currentStatus === "paused").length,
        completedCount: schedules.filter((s) => s.currentStatus === "completed").length,
        cancelledCount: schedules.filter((s) => s.currentStatus === "cancelled").length,
        missedCount: metrics.missedExecutions,
        conflictedCount: schedules.filter((s) => s.currentStatus === "conflicted").length,
        totalExecutions: metrics.totalExecutions,
        totalEventTriggers: metrics.totalEventTriggers,
        totalConflicts: metrics.totalConflicts,
        supportingEvidence: [
          `metrics:schedules=${metrics.totalSchedules}`,
          `metrics:executions=${metrics.totalExecutions}`,
        ],
        fabricated: false,
        structuralSignalOnly: true,
      },
      conflictSummary: {
        totalConflicts: metrics.totalConflicts,
        openConflicts: store.listConflicts().length,
        supportingEvidence: [`conflicts=${metrics.totalConflicts}`],
        fabricated: false,
        structuralSignalOnly: true,
      },
      supportingEvidence: [
        ...params.supportingEvidence,
        "config/scheduling-runtime.config.json",
        `metrics:active=${metrics.activeSchedules}`,
        `metrics:completed=${metrics.completedExecutions}`,
      ],
      auditStatus: params.auditStatus,
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: SCHRT_METADATA_VERSION,
      reportVersion: SCHRT_REPORT_VERSION,
      workerId: config.workerId,
      consumableByQ1013: true,
      neverFabricateExecutionTimes: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverReplaceQueueRuntime: true,
      neverReplaceMissionRuntime: true,
      neverExecuteUnauthorizedWork: true,
      neverImplementQ1013OrLater: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveSchedulingHistory: true,
      preserveAuditHistory: true,
      deterministicSchedulingBehaviour: true,
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
      if (key === "auditReference" || key === "triggerRef" || key === "queueRef") {
        result[key] =
          typeof nested === "string" &&
          (nested.startsWith("audit://") ||
            nested.startsWith("trig://") ||
            nested.startsWith("queue://") ||
            nested.startsWith("msg://") ||
            nested === null)
            ? nested
            : typeof nested === "string"
              ? nested.startsWith("audit://") ||
                nested.startsWith("trig://") ||
                nested.startsWith("queue://") ||
                nested.startsWith("msg://")
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
