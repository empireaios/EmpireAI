/** E5-10 — Review reporting and metrics. */

import type { ReviewExecutiveReport, ReviewMetrics, ReviewAuditLogEntry } from "./types.js";

export function buildReviewExecutiveReport(input: {
  reviewHealth: string;
  totalReviews: number;
  activeReviews: number;
  auditHistory: ReviewAuditLogEntry[];
}): ReviewExecutiveReport {
  const completedActions = input.auditHistory.filter((e) => e.newStatus === "completed").length;
  return {
    currentStatus: input.reviewHealth,
    totalReviews: input.totalReviews,
    activeReviews: input.activeReviews,
    completedActions,
    executiveSummary: `${input.totalReviews} executive reviews · ${input.activeReviews} active · ${completedActions} actions completed`,
    generatedAt: new Date().toISOString(),
  };
}

export function buildReviewMetrics(input: {
  records: Array<{ reviewStatus: string; confidence: number }>;
  assignedActions: Array<{ progress: number; status: string }>;
  governanceHealthScore: number;
}): ReviewMetrics {
  const statuses = input.records.map((r) => r.reviewStatus);
  const avgConfidence =
    input.records.length > 0
      ? Math.round(input.records.reduce((a, b) => a + b.confidence, 0) / input.records.length)
      : 0;
  return {
    totalReviews: input.records.length,
    activeCount: statuses.filter((s) => s === "in_progress" || s === "findings_ready" || s === "actions_assigned").length,
    completedCount: statuses.filter((s) => s === "completed" || s === "validated").length,
    assignedActionCount: input.assignedActions.length,
    completedActionCount: input.assignedActions.filter((a) => a.progress >= 100 || a.status === "completed").length,
    averageConfidence: avgConfidence,
    governanceHealthScore: input.governanceHealthScore,
  };
}
