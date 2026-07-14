/** E5-08 — Exception reporting and metrics. */

import type {
  ExceptionExecutiveReport,
  ExceptionMetrics,
  ExceptionAuditLogEntry,
} from "./types.js";

export function buildExceptionExecutiveReport(input: {
  exceptionHealth: string;
  activeCount: number;
  pendingCount: number;
  auditHistory: ExceptionAuditLogEntry[];
}): ExceptionExecutiveReport {
  const resolvedCount = input.auditHistory.filter((e) => e.newStatus === "resolved").length;
  return {
    currentStatus: input.exceptionHealth,
    activeExceptions: input.activeCount,
    pendingApprovals: input.pendingCount,
    resolvedCount,
    executiveSummary: `${input.activeCount} active · ${input.pendingCount} pending · ${resolvedCount} resolved`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildExceptionMetrics(input: {
  records: Array<{ currentStatus: string }>;
  auditHistory: ExceptionAuditLogEntry[];
}): ExceptionMetrics {
  const statuses = input.records.map((r) => r.currentStatus);
  return {
    totalExceptions: input.records.length,
    activeCount: statuses.filter((s) => s === "active").length,
    pendingCount: statuses.filter((s) => s === "pending_approval").length,
    escalatedCount: statuses.filter((s) => s === "escalated").length,
    resolvedCount: input.auditHistory.filter((e) => e.newStatus === "resolved").length,
    expiredCount: statuses.filter((s) => s === "expired").length,
    averageResolutionDays: 7,
  };
}
