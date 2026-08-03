import type { CompetitorProfile, LocalMarketResearchReport, ResearchSession } from "./types.js";

/** Authoritative in-memory LMRW store — sessions, reports, competitor dedupe, audit. */
export class ResearchStore {
  private sessions = new Map<string, ResearchSession>();
  private reports = new Map<string, LocalMarketResearchReport>();
  private competitors = new Map<string, CompetitorProfile>();
  private latestResearchId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    researchId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: LocalMarketResearchReport[]) {
    this.sessions.clear();
    this.reports.clear();
    this.competitors.clear();
    this.latestResearchId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.researchId, cloneReport(report));
      this.latestReportId = report.researchId;
      this.latestResearchId = report.researchId;
      for (const competitor of report.competitorProfiles) {
        this.upsertCompetitor(competitor);
      }
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        researchId: report.researchId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  sessionCount() {
    return this.sessions.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listSessions() {
    return [...this.sessions.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneSession);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  getSession(researchId: string) {
    const session = this.sessions.get(researchId);
    return session ? cloneSession(session) : null;
  }

  getReport(researchId: string) {
    const report = this.reports.get(researchId);
    return report ? cloneReport(report) : null;
  }

  getLatestResearchId() {
    return this.latestResearchId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  listCompetitors() {
    return [...this.competitors.values()].map((c) => cloneCompetitor(c));
  }

  saveSession(session: ResearchSession, action = "save_session") {
    this.sessions.set(session.researchId, cloneSession(session));
    this.latestResearchId = session.researchId;
    for (const competitor of session.competitorProfiles) {
      this.upsertCompetitor(competitor);
    }
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      researchId: session.researchId,
      action,
      details: `status=${session.status} competitors=${session.competitorProfiles.length}`,
    });
    return cloneSession(session);
  }

  saveReport(report: LocalMarketResearchReport, action = "save_report") {
    this.reports.set(report.researchId, cloneReport(report));
    this.latestReportId = report.researchId;
    this.latestResearchId = report.researchId;
    for (const competitor of report.competitorProfiles) {
      this.upsertCompetitor(competitor);
    }
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      researchId: report.researchId,
      action,
      details: `confidence=${report.confidenceScore} category=${report.serviceCategory}`,
    });
    return cloneReport(report);
  }

  markSubmitted(researchId: string, executiveReportId: string) {
    const current = this.reports.get(researchId);
    if (!current) return null;
    const updated: LocalMarketResearchReport = {
      ...cloneReport(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    const session = this.sessions.get(researchId);
    if (session) {
      this.saveSession({ ...cloneSession(session), status: "submitted" }, "submit_report");
    }
    return this.saveReport(updated, "submit_report");
  }

  private upsertCompetitor(competitor: CompetitorProfile) {
    const key = `${competitor.name.trim().toLowerCase()}|${competitor.serviceArea
      .trim()
      .toLowerCase()}`;
    if (!this.competitors.has(key)) {
      this.competitors.set(key, cloneCompetitor(competitor));
    }
  }
}

function cloneCompetitor(c: CompetitorProfile): CompetitorProfile {
  return {
    ...c,
    services: [...c.services],
    channels: [...c.channels],
    strengths: [...c.strengths],
    weaknesses: [...c.weaknesses],
    gaps: [...c.gaps],
  };
}

function cloneSession(session: ResearchSession): ResearchSession {
  return {
    ...session,
    input: { ...session.input },
    customerSegments: [...session.customerSegments],
    competitorProfiles: session.competitorProfiles.map(cloneCompetitor),
    customerPainPoints: session.customerPainPoints.map((p) => ({
      ...p,
      supportingEvidence: [...p.supportingEvidence],
    })),
    serviceGaps: session.serviceGaps.map((g) => ({
      ...g,
      supportingEvidence: [...g.supportingEvidence],
    })),
    opportunityFindings: session.opportunityFindings.map((o) => ({
      ...o,
      supportingEvidence: [...o.supportingEvidence],
      operationalConsiderations: [...o.operationalConsiderations],
      risks: [...o.risks],
    })),
    evidenceSources: session.evidenceSources.map((e) => ({ ...e })),
    risks: [...session.risks],
    assumptions: [...session.assumptions],
    unknowns: [...session.unknowns],
    demandFindings: session.demandFindings
      ? {
          demandIndicators: session.demandFindings.demandIndicators.map((v) => ({ ...v })),
          searchPatterns: session.demandFindings.searchPatterns.map((v) => ({ ...v })),
          frequencySignals: session.demandFindings.frequencySignals.map((v) => ({ ...v })),
          urgencySignals: session.demandFindings.urgencySignals.map((v) => ({ ...v })),
          seasonalPatterns: session.demandFindings.seasonalPatterns.map((v) => ({ ...v })),
          residentialVsCommercial: session.demandFindings.residentialVsCommercial.map((v) => ({
            ...v,
          })),
          segmentDifferences: session.demandFindings.segmentDifferences.map((v) => ({ ...v })),
          geographicConcentration: session.demandFindings.geographicConcentration.map((v) => ({
            ...v,
          })),
          repeatPotential: session.demandFindings.repeatPotential.map((v) => ({ ...v })),
          emergencyPotential: session.demandFindings.emergencyPotential.map((v) => ({ ...v })),
        }
      : null,
    pricingFindings: session.pricingFindings ? { ...session.pricingFindings } : null,
    marketAttractivenessAssessment: session.marketAttractivenessAssessment
      ? { ...session.marketAttractivenessAssessment }
      : null,
    fixture: session.fixture ? { ...session.fixture } : null,
  };
}

function cloneReport(report: LocalMarketResearchReport): LocalMarketResearchReport {
  return {
    ...report,
    customerSegments: [...report.customerSegments],
    risks: [...report.risks],
    assumptions: [...report.assumptions],
    unknowns: [...report.unknowns],
    recommendedResearchFollowUps: [...report.recommendedResearchFollowUps],
    traceabilityRefs: [...report.traceabilityRefs],
    competitorProfiles: report.competitorProfiles.map(cloneCompetitor),
    customerPainPoints: report.customerPainPoints.map((p) => ({
      ...p,
      supportingEvidence: [...p.supportingEvidence],
    })),
    serviceGaps: report.serviceGaps.map((g) => ({
      ...g,
      supportingEvidence: [...g.supportingEvidence],
    })),
    opportunityFindings: report.opportunityFindings.map((o) => ({
      ...o,
      supportingEvidence: [...o.supportingEvidence],
      operationalConsiderations: [...o.operationalConsiderations],
      risks: [...o.risks],
    })),
    evidenceSources: report.evidenceSources.map((e) => ({ ...e })),
    demandFindings: {
      demandIndicators: report.demandFindings.demandIndicators.map((v) => ({ ...v })),
      searchPatterns: report.demandFindings.searchPatterns.map((v) => ({ ...v })),
      frequencySignals: report.demandFindings.frequencySignals.map((v) => ({ ...v })),
      urgencySignals: report.demandFindings.urgencySignals.map((v) => ({ ...v })),
      seasonalPatterns: report.demandFindings.seasonalPatterns.map((v) => ({ ...v })),
      residentialVsCommercial: report.demandFindings.residentialVsCommercial.map((v) => ({ ...v })),
      segmentDifferences: report.demandFindings.segmentDifferences.map((v) => ({ ...v })),
      geographicConcentration: report.demandFindings.geographicConcentration.map((v) => ({ ...v })),
      repeatPotential: report.demandFindings.repeatPotential.map((v) => ({ ...v })),
      emergencyPotential: report.demandFindings.emergencyPotential.map((v) => ({ ...v })),
    },
    pricingFindings: { ...report.pricingFindings },
    marketAttractivenessAssessment: { ...report.marketAttractivenessAssessment },
    consumableByQ703: true,
    neverFinalizeServicePackages: true,
    neverSetFinalPrices: true,
    neverMakeLaunchDecisions: true,
    neverBuildBookingSystems: true,
    neverBuildWebsites: true,
    neverContactCustomersOrCompetitorsWithoutApproval: true,
    neverPurchaseDataOrAdvertisingWithoutApproval: true,
    neverFabricateDemandPricingOrCompetitorData: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ703OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
