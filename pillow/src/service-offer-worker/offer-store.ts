import type { OfferSession, ServiceOfferReport } from "./types.js";

/** Authoritative in-memory SOW store — sessions, reports, audit. */
export class OfferStore {
  private sessions = new Map<string, OfferSession>();
  private reports = new Map<string, ServiceOfferReport>();
  private latestOfferId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    offerId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: ServiceOfferReport[]) {
    this.sessions.clear();
    this.reports.clear();
    this.latestOfferId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestOfferId = report.reportId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        offerId: report.reportId,
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

  getSession(offerId: string) {
    const session = this.sessions.get(offerId);
    return session ? cloneSession(session) : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getLatestOfferId() {
    return this.latestOfferId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveSession(session: OfferSession, action = "save_session") {
    this.sessions.set(session.offerId, cloneSession(session));
    this.latestOfferId = session.offerId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      offerId: session.offerId,
      action,
      details: `status=${session.status} packages=${session.servicePackages.length}`,
    });
    return cloneSession(session);
  }

  saveReport(report: ServiceOfferReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.latestOfferId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      offerId: report.reportId,
      action,
      details: `confidence=${report.confidenceScore} research=${report.sourceResearchId}`,
    });
    return cloneReport(report);
  }

  markSubmitted(reportId: string, executiveReportId: string) {
    const current = this.reports.get(reportId);
    if (!current) return null;
    const updated: ServiceOfferReport = {
      ...cloneReport(current),
      submittedToExecutiveReporting: true,
      executiveReportId,
    };
    const session = this.sessions.get(reportId);
    if (session) {
      this.saveSession({ ...cloneSession(session), status: "submitted" }, "submit_report");
    }
    return this.saveReport(updated, "submit_report");
  }
}

function cloneSession(session: OfferSession): OfferSession {
  return {
    ...session,
    input: { ...session.input },
    serviceCatalogue: session.serviceCatalogue.map((s) => ({
      ...s,
      targetSegments: [...s.targetSegments],
      sourceResearchRefs: [...s.sourceResearchRefs],
    })),
    servicePackages: session.servicePackages.map((p) => ({
      ...p,
      pricingAssumptions: [...p.pricingAssumptions],
      optionalExtras: [...p.optionalExtras],
      renewalOptions: [...p.renewalOptions],
      inclusions: [...p.inclusions],
      exclusions: [...p.exclusions],
      sourceResearchRefs: [...p.sourceResearchRefs],
      recommendedPrice: { ...p.recommendedPrice },
      estimatedOperationalCost: { ...p.estimatedOperationalCost },
      estimatedGrossMargin: { ...p.estimatedGrossMargin },
    })),
    pricingRecommendations: session.pricingRecommendations.map((r) => ({
      ...r,
      pricingAssumptions: [...r.pricingAssumptions],
      recommendedPrice: { ...r.recommendedPrice },
      referencesQ702PricingFindings: true,
    })),
    packageInclusions: session.packageInclusions.map((p) => ({
      ...p,
      inclusions: [...p.inclusions],
    })),
    packageExclusions: session.packageExclusions.map((p) => ({
      ...p,
      exclusions: [...p.exclusions],
    })),
    guarantees: session.guarantees.map((g) => ({ ...g })),
    fulfilmentRequirements: session.fulfilmentRequirements.map((f) => ({
      ...f,
      skills: [...f.skills],
      equipment: [...f.equipment],
      materials: [...f.materials],
      licences: [...f.licences],
      workflowPrerequisites: [...f.workflowPrerequisites],
      customerPreparation: [...f.customerPreparation],
      completionCriteria: [...f.completionCriteria],
    })),
    operationalAssumptions: [...session.operationalAssumptions],
    risks: [...session.risks],
    outstandingQuestions: [...session.outstandingQuestions],
    marketResearch: session.marketResearch ? { ...session.marketResearch } : null,
  };
}

function cloneReport(report: ServiceOfferReport): ServiceOfferReport {
  return {
    ...report,
    serviceCatalogue: report.serviceCatalogue.map((s) => ({
      ...s,
      targetSegments: [...s.targetSegments],
      sourceResearchRefs: [...s.sourceResearchRefs],
    })),
    servicePackages: report.servicePackages.map((p) => ({
      ...p,
      pricingAssumptions: [...p.pricingAssumptions],
      optionalExtras: [...p.optionalExtras],
      renewalOptions: [...p.renewalOptions],
      inclusions: [...p.inclusions],
      exclusions: [...p.exclusions],
      sourceResearchRefs: [...p.sourceResearchRefs],
      recommendedPrice: { ...p.recommendedPrice },
      estimatedOperationalCost: { ...p.estimatedOperationalCost },
      estimatedGrossMargin: { ...p.estimatedGrossMargin },
    })),
    pricingRecommendations: report.pricingRecommendations.map((r) => ({
      ...r,
      pricingAssumptions: [...r.pricingAssumptions],
      recommendedPrice: { ...r.recommendedPrice },
      referencesQ702PricingFindings: true,
    })),
    packageInclusions: report.packageInclusions.map((p) => ({
      ...p,
      inclusions: [...p.inclusions],
    })),
    packageExclusions: report.packageExclusions.map((p) => ({
      ...p,
      exclusions: [...p.exclusions],
    })),
    guarantees: report.guarantees.map((g) => ({ ...g })),
    fulfilmentRequirements: report.fulfilmentRequirements.map((f) => ({
      ...f,
      skills: [...f.skills],
      equipment: [...f.equipment],
      materials: [...f.materials],
      licences: [...f.licences],
      workflowPrerequisites: [...f.workflowPrerequisites],
      customerPreparation: [...f.customerPreparation],
      completionCriteria: [...f.completionCriteria],
    })),
    operationalAssumptions: [...report.operationalAssumptions],
    risks: [...report.risks],
    outstandingQuestions: [...report.outstandingQuestions],
    evidenceAssumptionNotes: [...report.evidenceAssumptionNotes],
    traceabilityRefs: [...report.traceabilityRefs],
    consumableByQ704: true,
    neverBuildBookingSystems: true,
    neverBuildCrm: true,
    neverExecuteCustomerJobs: true,
    neverLaunchBusiness: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricatePricingEvidence: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ704OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
