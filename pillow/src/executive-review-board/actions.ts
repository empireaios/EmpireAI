/** E5-10 — Assigned actions and review calendar. */

import type {
  ExecutiveReviewRecord,
  AssignedActionEntry,
  ReviewCalendarEntry,
  CurrentReviewEntry,
  ExecutiveFindingEntry,
  StrategicProgressEntry,
  GovernanceHealthEntry,
} from "./types.js";

export function buildAssignedActions(records: ExecutiveReviewRecord[]): AssignedActionEntry[] {
  return records
    .filter((r) => r.assignedActions && r.assignedActions !== "None")
    .map((r) => ({
      actionId: `act-${r.reviewId}`,
      reviewId: r.reviewId,
      title: r.reviewTitle,
      action: r.assignedActions,
      owner: r.businessArea.split("·")[0]?.trim() ?? "Executive",
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      progress: r.reviewStatus === "completed" ? 100 : r.reviewStatus === "validated" ? 90 : r.reviewStatus === "actions_assigned" ? 55 : 30,
      status: r.reviewStatus,
    }));
}

export function buildReviewCalendar(records: ExecutiveReviewRecord[]): ReviewCalendarEntry[] {
  const now = new Date();
  return records.map((r, i) => {
    const scheduled = new Date(now);
    scheduled.setDate(scheduled.getDate() + i * 7);
    return {
      calendarId: `cal-${r.reviewId}`,
      reviewId: r.reviewId,
      title: r.reviewTitle,
      category: r.category,
      scheduledDate: scheduled.toISOString().slice(0, 10),
      reviewCycle: i % 2 === 0 ? "weekly" : "biweekly",
      status: r.reviewStatus,
    };
  });
}

export function buildCurrentReviews(records: ExecutiveReviewRecord[]): CurrentReviewEntry[] {
  return records
    .filter((r) => r.reviewStatus !== "completed")
    .map((r) => ({
      currentId: `cur-${r.reviewId}`,
      reviewId: r.reviewId,
      title: r.reviewTitle,
      category: r.category,
      reviewStatus: r.reviewStatus,
      owner: r.businessArea,
      progress: r.reviewStatus === "validated" ? 90 : r.reviewStatus === "actions_assigned" ? 70 : r.reviewStatus === "findings_ready" ? 50 : 35,
    }));
}

export function buildExecutiveFindings(records: ExecutiveReviewRecord[]): ExecutiveFindingEntry[] {
  return records.map((r) => ({
    findingId: `find-${r.reviewId}`,
    reviewId: r.reviewId,
    title: r.reviewTitle,
    finding: r.executiveFindings,
    impact: r.businessImpact,
    severity: r.confidence >= 90 ? "high" : r.confidence >= 75 ? "medium" : "low",
    status: r.reviewStatus,
  }));
}

export function buildStrategicProgress(records: ExecutiveReviewRecord[]): StrategicProgressEntry[] {
  return records
    .filter((r) => r.category === "strategic_reviews" || r.category === "mission_reviews" || r.category === "programme_reviews")
    .map((r) => ({
      progressId: `prog-${r.reviewId}`,
      reviewId: r.reviewId,
      objective: r.strategicObjectives,
      progress: r.reviewStatus === "completed" ? 100 : r.reviewStatus === "validated" ? 85 : 60,
      status: r.reviewStatus,
      trend: r.reviewStatus === "completed" ? "improving" : "stable",
    }));
}

export function buildGovernanceHealthEntries(input: {
  e5Gov: boolean;
  e5Risk: boolean;
  healthScore: number;
}): GovernanceHealthEntry[] {
  return [
    { healthId: "gov-e5", domain: "E5 Governance Chain", score: input.e5Gov ? 92 : 78, status: input.e5Gov ? "strong" : "stable", summary: "E5-01 through E5-09 integration" },
    { healthId: "gov-risk", domain: "Enterprise Risk Governance", score: input.e5Risk ? 90 : 75, status: input.e5Risk ? "strong" : "stable", summary: "Risk register and mitigation oversight" },
    { healthId: "gov-const", domain: "Constitutional Integrity", score: input.healthScore, status: input.healthScore >= 85 ? "strong" : "stable", summary: "Constitution hierarchy compliance" },
    { healthId: "gov-review", domain: "Review Board Health", score: Math.min(100, input.healthScore + 2), status: "active", summary: "Continuous executive review cycles" },
  ];
}
