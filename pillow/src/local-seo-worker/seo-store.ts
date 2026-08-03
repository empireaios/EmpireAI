import type { LandingPageAsset, LocalSeoReport, SeoSession } from "./types.js";

/** Authoritative in-memory LSEO store — sessions, reports, landing pages, audit. */
export class SeoStore {
  private sessions = new Map<string, SeoSession>();
  private reports = new Map<string, LocalSeoReport>();
  private latestSeoId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    seoId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: LocalSeoReport[]) {
    this.sessions.clear();
    this.reports.clear();
    this.latestSeoId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestSeoId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        seoId: report.reportId,
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

  listLandingPages(): LandingPageAsset[] {
    const fromSessions = this.listSessions().flatMap((s) => s.landingPages);
    const fromReports = this.listReports().flatMap((r) => r.landingPagesGenerated);
    const byId = new Map<string, LandingPageAsset>();
    for (const page of [...fromSessions, ...fromReports]) {
      byId.set(page.pageId, { ...page });
    }
    return [...byId.values()];
  }

  getSession(seoId: string) {
    const session = this.sessions.get(seoId);
    return session ? cloneSession(session) : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getLatestSeoId() {
    return this.latestSeoId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveSession(session: SeoSession, action = "save_session") {
    this.sessions.set(session.seoId, cloneSession(session));
    this.latestSeoId = session.seoId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      seoId: session.seoId,
      action,
      details: `status=${session.status} pages=${session.landingPages.length}`,
    });
    return cloneSession(session);
  }

  saveReport(report: LocalSeoReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.latestSeoId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      seoId: report.reportId,
      action,
      details: `confidence=${report.confidenceScore} offer=${report.sourceOfferReportId}`,
    });
    return cloneReport(report);
  }

  markSubmitted(reportId: string, executiveReportId: string) {
    const current = this.reports.get(reportId);
    if (!current) return null;
    const updated: LocalSeoReport = {
      ...cloneReport(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
      auditStatus: "submitted",
    };
    const session = this.sessions.get(reportId);
    if (session) {
      this.saveSession({ ...cloneSession(session), status: "submitted" }, "submit_report");
    }
    return this.saveReport(updated, "submit_report");
  }
}

function cloneSession(session: SeoSession): SeoSession {
  return {
    ...session,
    input: { ...session.input },
    landingPages: session.landingPages.map(clonePage),
    googleBusinessRecommendations: session.googleBusinessRecommendations.map((g) => ({
      ...g,
      secondaryCategorySuggestions: [...g.secondaryCategorySuggestions],
      serviceItems: [...g.serviceItems],
      photoSuggestions: [...g.photoSuggestions],
      postIdeas: [...g.postIdeas],
      napChecklist: [...g.napChecklist],
      sourceOfferRefs: [...g.sourceOfferRefs],
      neverModifyLiveGbpAutomatically: true,
    })),
    localKeywords: session.localKeywords.map((k) => ({
      ...k,
      sourceOfferRefs: [...k.sourceOfferRefs],
    })),
    metadata: session.metadata.map((m) => ({
      ...m,
      sourceOfferRefs: [...m.sourceOfferRefs],
    })),
    structuredDataRecommendations: session.structuredDataRecommendations.map((s) => ({
      ...s,
      jsonLdOutline: { ...s.jsonLdOutline },
      notes: [...s.notes],
      sourceOfferRefs: [...s.sourceOfferRefs],
    })),
    citationRecommendations: session.citationRecommendations.map((c) => ({
      ...c,
      napFields: [...c.napFields],
      sourceOfferRefs: [...c.sourceOfferRefs],
      neverPurchaseBacklinks: true,
    })),
    internalLinkingRecommendations: session.internalLinkingRecommendations.map((l) => ({
      ...l,
    })),
    napConsistencyRecommendations: session.napConsistencyRecommendations.map((n) => ({
      ...n,
      consistencyNotes: [...n.consistencyNotes],
      sourceChannels: [...n.sourceChannels],
    })),
    faqAssets: session.faqAssets.map((f) => ({ ...f })),
    completeness: session.completeness
      ? {
          ...session.completeness,
          checklist: session.completeness.checklist.map((c) => ({ ...c })),
          outstandingGaps: [...session.completeness.outstandingGaps],
          neverClaimsLiveRankingOrTraffic: true,
        }
      : null,
    serviceOffer: session.serviceOffer ? { ...session.serviceOffer } : null,
  };
}

function clonePage(page: LandingPageAsset): LandingPageAsset {
  return {
    ...page,
    headings: [...page.headings],
    bodyOutline: [...page.bodyOutline],
    imageAltText: [...page.imageAltText],
    faq: page.faq.map((f) => ({ ...f })),
    sourceOfferRefs: [...page.sourceOfferRefs],
  };
}

function cloneReport(report: LocalSeoReport): LocalSeoReport {
  return {
    ...report,
    landingPagesGenerated: report.landingPagesGenerated.map(clonePage),
    googleBusinessRecommendations: report.googleBusinessRecommendations.map((g) => ({
      ...g,
      secondaryCategorySuggestions: [...g.secondaryCategorySuggestions],
      serviceItems: [...g.serviceItems],
      photoSuggestions: [...g.photoSuggestions],
      postIdeas: [...g.postIdeas],
      napChecklist: [...g.napChecklist],
      sourceOfferRefs: [...g.sourceOfferRefs],
      neverModifyLiveGbpAutomatically: true,
    })),
    localKeywords: report.localKeywords.map((k) => ({
      ...k,
      sourceOfferRefs: [...k.sourceOfferRefs],
    })),
    metadata: report.metadata.map((m) => ({
      ...m,
      sourceOfferRefs: [...m.sourceOfferRefs],
    })),
    structuredDataRecommendations: report.structuredDataRecommendations.map((s) => ({
      ...s,
      jsonLdOutline: { ...s.jsonLdOutline },
      notes: [...s.notes],
      sourceOfferRefs: [...s.sourceOfferRefs],
    })),
    citationRecommendations: report.citationRecommendations.map((c) => ({
      ...c,
      napFields: [...c.napFields],
      sourceOfferRefs: [...c.sourceOfferRefs],
      neverPurchaseBacklinks: true,
    })),
    internalLinkingRecommendations: report.internalLinkingRecommendations.map((l) => ({
      ...l,
    })),
    napConsistencyRecommendations: report.napConsistencyRecommendations.map((n) => ({
      ...n,
      consistencyNotes: [...n.consistencyNotes],
      sourceChannels: [...n.sourceChannels],
    })),
    faqAssets: report.faqAssets.map((f) => ({ ...f })),
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    seoCompletenessStatus: {
      ...report.seoCompletenessStatus,
      checklist: report.seoCompletenessStatus.checklist.map((c) => ({ ...c })),
      outstandingGaps: [...report.seoCompletenessStatus.outstandingGaps],
      neverClaimsLiveRankingOrTraffic: true,
    },
    consumableByQ708: true,
    neverPublishWebsites: true,
    neverPurchaseBacklinks: true,
    neverManipulateSearchRankings: true,
    neverModifyLiveGoogleBusinessProfilesAutomatically: true,
    neverModifyUnrelatedPlatformComponents: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateSeoPerformanceResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ708OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
