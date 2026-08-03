import type { MediaExecutiveReviewReport } from "./types.js";

/** Authoritative in-memory media executive review report store — structural signals only. */
export class ReviewStore {
  private reports = new Map<string, MediaExecutiveReviewReport>();
  private latestReviewId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    reviewId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: MediaExecutiveReviewReport[]) {
    this.reports.clear();
    this.latestReviewId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reviewId, clone(report));
    }
    this.latestReviewId = reportTail(reports);
    for (const report of reports) {
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        reviewId: report.reviewId,
        action: "seed",
        details: `seeded reviewId=${report.reviewId} mediaId=${report.mediaId}`,
      });
    }
  }

  count() {
    return this.reports.size;
  }

  list() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(clone);
  }

  get(reviewId: string) {
    const report = this.reports.get(reviewId);
    return report ? clone(report) : null;
  }

  getByMediaId(mediaId: string) {
    return this.list().find((r) => r.mediaId === mediaId) ?? null;
  }

  getLatestReviewId() {
    return this.latestReviewId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: MediaExecutiveReviewReport, action = "save") {
    this.reports.set(report.reviewId, clone(report));
    this.latestReviewId = report.reviewId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      reviewId: report.reviewId,
      action,
      details: `mediaId=${report.mediaId} recommendation=${report.executiveRecommendation} completeness=${report.assetCompleteness.completenessScore}`,
    });
    return clone(report);
  }

  markSubmitted(reviewId: string, executiveReportId: string) {
    const current = this.reports.get(reviewId);
    if (!current) return null;
    const updated: MediaExecutiveReviewReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function reportTail(reports: MediaExecutiveReviewReport[]): string | null {
  if (!reports.length) return null;
  return reports[reports.length - 1]?.reviewId ?? null;
}

function clone(report: MediaExecutiveReviewReport): MediaExecutiveReviewReport {
  return {
    ...report,
    assetCompleteness: {
      ...report.assetCompleteness,
      missingItems: [...report.assetCompleteness.missingItems],
    },
    qualityAssessment: { ...report.qualityAssessment },
    complianceAssessment: { ...report.complianceAssessment },
    outstandingIssues: report.outstandingIssues.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    prerequisiteWorkerStatuses: report.prerequisiteWorkerStatuses.map((p) => ({ ...p })),
    verifiedFindings: report.verifiedFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    recommendationFindings: report.recommendationFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
