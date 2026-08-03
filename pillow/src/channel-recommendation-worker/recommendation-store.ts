import type { ChannelRecommendationReport } from "./types.js";

/** Authoritative in-memory channel recommendation report store — structural signals only. */
export class RecommendationStore {
  private reports = new Map<string, ChannelRecommendationReport>();
  private latestRecommendationId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    recommendationId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ChannelRecommendationReport[]) {
    this.reports.clear();
    this.latestRecommendationId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.recommendationId, clone(report));
    }
    this.latestRecommendationId = reportTail(reports);
    for (const report of reports) {
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        recommendationId: report.recommendationId,
        action: "seed",
        details: `seeded recommendationId=${report.recommendationId} channel=${report.proposedChannel.channelName}`,
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

  get(recommendationId: string) {
    const report = this.reports.get(recommendationId);
    return report ? clone(report) : null;
  }

  getByChannelName(channelName: string) {
    return this.list().find((r) => r.proposedChannel.channelName === channelName) ?? null;
  }

  getLatestRecommendationId() {
    return this.latestRecommendationId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  save(report: ChannelRecommendationReport, action = "save") {
    this.reports.set(report.recommendationId, clone(report));
    this.latestRecommendationId = report.recommendationId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      recommendationId: report.recommendationId,
      action,
      details: `channel=${report.proposedChannel.channelName} decision=${report.recommendation} score=${report.overallScore}`,
    });
    return clone(report);
  }

  markSubmitted(recommendationId: string, executiveReportId: string) {
    const current = this.reports.get(recommendationId);
    if (!current) return null;
    const updated: ChannelRecommendationReport = {
      ...clone(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    return this.save(updated, "submit_report");
  }
}

function reportTail(reports: ChannelRecommendationReport[]): string | null {
  if (!reports.length) return null;
  return reports[reports.length - 1]?.recommendationId ?? null;
}

function clone(report: ChannelRecommendationReport): ChannelRecommendationReport {
  return {
    ...report,
    proposedChannel: { ...report.proposedChannel },
    targetAudience: {
      ...report.targetAudience,
      audienceSegments: [...report.targetAudience.audienceSegments],
      geographyHints: [...report.targetAudience.geographyHints],
    },
    audiencePotential: {
      ...report.audiencePotential,
      evidenceRefs: [...report.audiencePotential.evidenceRefs],
    },
    revenuePotential: {
      ...report.revenuePotential,
      evidenceRefs: [...report.revenuePotential.evidenceRefs],
    },
    productionFeasibility: {
      ...report.productionFeasibility,
      evidenceRefs: [...report.productionFeasibility.evidenceRefs],
    },
    competitionAssessment: {
      ...report.competitionAssessment,
      evidenceRefs: [...report.competitionAssessment.evidenceRefs],
    },
    strategicFit: {
      ...report.strategicFit,
      evidenceRefs: [...report.strategicFit.evidenceRefs],
    },
    contentSustainability: {
      ...report.contentSustainability,
      evidenceRefs: [...report.contentSustainability.evidenceRefs],
    },
    riskAssessment: {
      ...report.riskAssessment,
      factors: [...report.riskAssessment.factors],
    },
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    rankedOpportunities: (report.rankedOpportunities ?? []).map((o) => ({ ...o })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
  };
}
