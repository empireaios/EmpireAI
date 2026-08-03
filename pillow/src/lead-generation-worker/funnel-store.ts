import type {
  CapturedLead,
  ConversionStageRecord,
  EnquiryForm,
  FunnelMetrics,
  LeadFunnel,
  LeadGenerationReport,
} from "./types.js";

/** Authoritative in-memory LGW store — funnels, forms, leads, reports, audit. */
export class FunnelStore {
  private funnels = new Map<string, LeadFunnel>();
  private forms = new Map<string, EnquiryForm>();
  private leads = new Map<string, CapturedLead>();
  private reports = new Map<string, LeadGenerationReport>();
  private stages: ConversionStageRecord[] = [];
  private metrics = new Map<string, FunnelMetrics>();
  private latestFunnelId: string | null = null;
  private latestFormId: string | null = null;
  private latestLeadId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{
    timestamp: string;
    entityId: string;
    action: string;
    details: string;
  }> = [];

  seed(reports: LeadGenerationReport[]) {
    this.funnels.clear();
    this.forms.clear();
    this.leads.clear();
    this.reports.clear();
    this.stages = [];
    this.metrics.clear();
    this.latestFunnelId = null;
    this.latestFormId = null;
    this.latestLeadId = null;
    this.latestReportId = null;
    this.auditTrail = [];
    for (const report of reports) {
      this.reports.set(report.reportId, cloneReport(report));
      this.latestReportId = report.reportId;
      this.latestFunnelId = report.funnelId;
      this.auditTrail.push({
        timestamp: new Date().toISOString(),
        entityId: report.reportId,
        action: "seed",
        details: `seeded report for project=${report.businessProjectId}`,
      });
    }
  }

  funnelCount() {
    return this.funnels.size;
  }

  formCount() {
    return this.forms.size;
  }

  leadCount() {
    return this.leads.size;
  }

  reportCount() {
    return this.reports.size;
  }

  listFunnels() {
    return [...this.funnels.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneFunnel);
  }

  listForms() {
    return [...this.forms.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(cloneForm);
  }

  listLeads() {
    return [...this.leads.values()]
      .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
      .map(cloneLead);
  }

  listReports() {
    return [...this.reports.values()]
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(cloneReport);
  }

  listStages(leadId?: string) {
    return this.stages
      .filter((s) => !leadId || s.leadId === leadId)
      .map((s) => ({ ...s }));
  }

  listMetrics() {
    return [...this.metrics.values()].map(cloneMetrics);
  }

  getFunnel(funnelId: string) {
    const funnel = this.funnels.get(funnelId);
    return funnel ? cloneFunnel(funnel) : null;
  }

  getForm(formId: string) {
    const form = this.forms.get(formId);
    return form ? cloneForm(form) : null;
  }

  getLead(leadId: string) {
    const lead = this.leads.get(leadId);
    return lead ? cloneLead(lead) : null;
  }

  getReport(reportId: string) {
    const report = this.reports.get(reportId);
    return report ? cloneReport(report) : null;
  }

  getLatestFunnelId() {
    return this.latestFunnelId;
  }

  getLatestFormId() {
    return this.latestFormId;
  }

  getLatestLeadId() {
    return this.latestLeadId;
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((entry) => ({ ...entry }));
  }

  saveFunnel(funnel: LeadFunnel, action = "save_funnel") {
    this.funnels.set(funnel.funnelId, cloneFunnel(funnel));
    this.latestFunnelId = funnel.funnelId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: funnel.funnelId,
      action,
      details: `status=${funnel.status} forms=${funnel.formIds.length}`,
    });
    return cloneFunnel(funnel);
  }

  saveForm(form: EnquiryForm, action = "save_form") {
    this.forms.set(form.formId, cloneForm(form));
    this.latestFormId = form.formId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: form.formId,
      action,
      details: `funnel=${form.funnelId} fields=${form.fields.length}`,
    });
    return cloneForm(form);
  }

  saveLead(lead: CapturedLead, action = "save_lead") {
    this.leads.set(lead.leadId, cloneLead(lead));
    this.latestLeadId = lead.leadId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: lead.leadId,
      action,
      details: `funnel=${lead.funnelId} qualification=${lead.qualificationStatus}`,
    });
    return cloneLead(lead);
  }

  saveStage(stage: ConversionStageRecord, action = "track_stage") {
    this.stages.push({ ...stage });
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: stage.leadId,
      action,
      details: `stage=${stage.stage}`,
    });
    return { ...stage };
  }

  saveMetrics(metrics: FunnelMetrics, action = "save_metrics") {
    this.metrics.set(metrics.funnelId, cloneMetrics(metrics));
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: metrics.funnelId,
      action,
      details: `captured=${metrics.totalCapturedLeads}`,
    });
    return cloneMetrics(metrics);
  }

  saveReport(report: LeadGenerationReport, action = "save_report") {
    this.reports.set(report.reportId, cloneReport(report));
    this.latestReportId = report.reportId;
    this.auditTrail.push({
      timestamp: new Date().toISOString(),
      entityId: report.reportId,
      action,
      details: `funnel=${report.funnelId} leads=${report.capturedLeads.length}`,
    });
    return cloneReport(report);
  }

  leadsForFunnel(funnelId: string) {
    return this.listLeads().filter((l) => l.funnelId === funnelId);
  }

  formsForFunnel(funnelId: string) {
    return this.listForms().filter((f) => f.funnelId === funnelId);
  }
}

function cloneFunnel(funnel: LeadFunnel): LeadFunnel {
  return {
    ...funnel,
    landingPageRefs: [...funnel.landingPageRefs],
    formIds: [...funnel.formIds],
    notes: [...funnel.notes],
  };
}

function cloneForm(form: EnquiryForm): EnquiryForm {
  return {
    ...form,
    fields: form.fields.map((f) => ({
      ...f,
      options: f.options ? [...f.options] : undefined,
    })),
    neverExposeProhibitedPersonalData: true,
  };
}

function cloneLead(lead: CapturedLead): CapturedLead {
  return {
    ...lead,
    formSubmission: { ...lead.formSubmission },
    tags: [...lead.tags],
    fabricated: false,
    score: lead.score
      ? { ...lead.score, factors: [...lead.score.factors], fabricated: false }
      : null,
  };
}

function cloneMetrics(metrics: FunnelMetrics): FunnelMetrics {
  return {
    ...metrics,
    leadsBySource: { ...metrics.leadsBySource },
    leadsByQualification: { ...metrics.leadsByQualification },
    leadsByConversionStage: { ...metrics.leadsByConversionStage },
    notes: [...metrics.notes],
    derivedFromObservedCapturesOnly: true,
    neverFabricated: true,
  };
}

function cloneReport(report: LeadGenerationReport): LeadGenerationReport {
  return {
    ...report,
    forms: report.forms.map(cloneForm),
    capturedLeads: report.capturedLeads.map(cloneLead),
    funnelPerformanceSummary: cloneMetrics(report.funnelPerformanceSummary),
    sourceAttribution: {
      ...report.sourceAttribution,
      seoKeywordHints: [...report.sourceAttribution.seoKeywordHints],
    },
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    leadScore: report.leadScore
      ? {
          ...report.leadScore,
          factors: [...report.leadScore.factors],
          fabricated: false,
        }
      : null,
    consumableByQ709: true,
    neverExecuteAdvertisingCampaigns: true,
    neverReplaceCrm: true,
    neverReplaceBookingWorker: true,
    neverDeliverCustomerJobs: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverFabricateLeadOrConversionResults: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ709OrLater: true,
    preserveCompleteLeadTraceability: true,
    preserveFunnelAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
