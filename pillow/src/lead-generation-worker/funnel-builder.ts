import type { LeadGenerationWorkerConfiguration } from "./configuration.js";
import {
  LEAD_GENERATION_REPORT_VERSION,
  LEAD_GENERATION_WORKER_IDENTITY,
  LGW_METADATA_VERSION,
} from "./paths.js";
import type {
  CapturedLead,
  EnquiryForm,
  FunnelMetrics,
  IntegrationHandshake,
  LeadFunnel,
  LeadGenInput,
  LeadGenerationReport,
  LeadGenerationWorkerCatalog,
  LeadScore,
  LocalSeoFixture,
  LocalSeoReport,
  SourceAttribution,
} from "./types.js";

let funnelSeq = 0;
let formSeq = 0;
let leadSeq = 0;
let reportSeq = 0;
let scoreSeq = 0;
let stageSeq = 0;
let metricsSeq = 0;
let runSeq = 0;
let engineSeq = 0;

export function resetLgwSequenceForTesting() {
  funnelSeq = 0;
  formSeq = 0;
  leadSeq = 0;
  reportSeq = 0;
  scoreSeq = 0;
  stageSeq = 0;
  metricsSeq = 0;
  runSeq = 0;
  engineSeq = 0;
}

export function nextFunnelId() {
  funnelSeq += 1;
  return `lgw-funnel-${String(funnelSeq).padStart(4, "0")}`;
}

export function nextFormId() {
  formSeq += 1;
  return `lgw-form-${String(formSeq).padStart(4, "0")}`;
}

export function nextLeadId() {
  leadSeq += 1;
  return `lgw-lead-${String(leadSeq).padStart(4, "0")}`;
}

export function nextReportId() {
  reportSeq += 1;
  return `lgw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextScoreId() {
  scoreSeq += 1;
  return `lgw-score-${String(scoreSeq).padStart(4, "0")}`;
}

export function nextStageId() {
  stageSeq += 1;
  return `lgw-stage-${String(stageSeq).padStart(4, "0")}`;
}

export function nextMetricsId() {
  metricsSeq += 1;
  return `lgw-metrics-${String(metricsSeq).padStart(4, "0")}`;
}

export function nextRunReportId() {
  runSeq += 1;
  return `lgw-run-${String(runSeq).padStart(4, "0")}`;
}

export function nextEngineRecordId() {
  engineSeq += 1;
  return `lgw-eng-${String(engineSeq).padStart(4, "0")}`;
}

export function normalizeLeadSource(
  value: string | null | undefined,
): LeadGenerationReport["leadSource"] {
  const v = (value ?? "unknown").trim().toLowerCase();
  const allowed = [
    "website_form",
    "landing_page",
    "call_request",
    "quote_request",
    "whatsapp",
    "contact_form",
    "multi_step",
    "unknown",
  ] as const;
  return (allowed as readonly string[]).includes(v)
    ? (v as LeadGenerationReport["leadSource"])
    : "unknown";
}

export function normalizeQualification(
  value: string | null | undefined,
): LeadGenerationReport["leadQualificationStatus"] {
  const v = (value ?? "unknown").trim().toLowerCase();
  const allowed = [
    "new",
    "contacted",
    "qualified",
    "disqualified",
    "routed_to_crm",
    "routed_to_booking",
    "unknown",
  ] as const;
  return (allowed as readonly string[]).includes(v)
    ? (v as LeadGenerationReport["leadQualificationStatus"])
    : "unknown";
}

export function normalizeConversionStage(
  value: string | null | undefined,
): LeadGenerationReport["conversionStage"] {
  const v = (value ?? "unknown").trim().toLowerCase();
  const allowed = [
    "visitor",
    "enquiry",
    "qualified_lead",
    "crm_captured",
    "booking_requested",
    "converted",
    "abandoned",
    "unknown",
  ] as const;
  return (allowed as readonly string[]).includes(v)
    ? (v as LeadGenerationReport["conversionStage"])
    : "unknown";
}

export class FunnelBuilder {
  buildCatalog(
    config: LeadGenerationWorkerConfiguration,
    reports: LeadGenerationReport[],
    funnels: LeadFunnel[],
    forms: EnquiryForm[],
    leads: CapturedLead[],
    metrics: FunnelMetrics[],
    integrations: IntegrationHandshake[],
  ): LeadGenerationWorkerCatalog {
    return {
      reportVersion: LEAD_GENERATION_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      funnels: funnels.map((f) => ({ ...f })),
      forms: forms.map((f) => ({ ...f })),
      leads: leads.map((l) => ({ ...l })),
      metrics: metrics.map((m) => ({ ...m })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LGW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteAdvertisingCampaigns: true,
      neverReplaceCrm: true,
      neverReplaceBookingWorker: true,
      neverDeliverCustomerJobs: true,
      neverFabricateLeadOrConversionResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ709OrLater: true,
      consumableByQ709: true,
    };
  }

  buildReport(params: {
    funnel: LeadFunnel;
    forms: EnquiryForm[];
    leads: CapturedLead[];
    metrics: FunnelMetrics;
    sourceSeoReportId: string;
    attribution: SourceAttribution;
    outstandingIssues: string[];
    confidenceScore: number;
    config: LeadGenerationWorkerConfiguration;
    reportId?: string;
  }): LeadGenerationReport {
    const now = new Date().toISOString();
    const primaryLead = params.leads[params.leads.length - 1] ?? null;
    return {
      reportId: params.reportId ?? nextReportId(),
      timestamp: now,
      businessProjectId: params.funnel.businessProjectId,
      funnelId: params.funnel.funnelId,
      leadSource: primaryLead?.leadSource ?? params.funnel.leadSourcePrimary,
      leadQualificationStatus:
        primaryLead?.qualificationStatus ?? ("unknown" as const),
      leadScore: primaryLead?.score ?? null,
      crmIntegrationStatus: primaryLead?.crmIntegrationStatus ?? "not_routed",
      bookingIntegrationStatus:
        primaryLead?.bookingIntegrationStatus ?? "not_routed",
      conversionStage: primaryLead?.conversionStage ?? "unknown",
      funnelPerformanceSummary: params.metrics,
      auditStatus: params.leads.length
        ? "leads_captured"
        : params.forms.length
          ? "funnel_ready"
          : "draft",
      outstandingIssues: [...params.outstandingIssues],
      confidenceScore: params.confidenceScore,
      metadataVersion: LGW_METADATA_VERSION,
      reportVersion: LEAD_GENERATION_REPORT_VERSION,
      workerId: params.config.workerId || LEAD_GENERATION_WORKER_IDENTITY.workerId,
      forms: params.forms.map((f) => ({
        ...f,
        fields: f.fields.map((field) => ({ ...field })),
        neverExposeProhibitedPersonalData: true as const,
      })),
      capturedLeads: params.leads.map((l) => ({
        ...l,
        formSubmission: { ...l.formSubmission },
        tags: [...l.tags],
        fabricated: false as const,
        score: l.score
          ? { ...l.score, factors: [...l.score.factors], fabricated: false as const }
          : null,
      })),
      sourceAttribution: {
        ...params.attribution,
        seoKeywordHints: [...params.attribution.seoKeywordHints],
      },
      sourceSeoReportId: params.sourceSeoReportId,
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
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-08:lead_generation:${params.funnel.funnelId}`,
        `source_seo:${params.sourceSeoReportId}`,
        ...params.leads.map((l) => `lead:${l.leadId}`),
      ],
    };
  }

  resolveSeoContext(input: LeadGenInput): {
    localSeo: LocalSeoReport | LocalSeoFixture | null;
    source: "localSeoReport" | "seoReportId" | "fixtureLocalSeo" | "none";
    sourceSeoReportId: string;
    businessName: string;
    serviceCategory: string;
    targetLocation: string;
    businessProjectId: string;
    landingPageRefs: string[];
    keywordHints: string[];
  } {
    if (input.localSeoReport) {
      const seo = input.localSeoReport;
      return {
        localSeo: seo,
        source: "localSeoReport",
        sourceSeoReportId: seo.reportId,
        businessName: input.businessName?.trim() || seo.serviceCategory,
        serviceCategory: input.serviceCategory?.trim() || seo.serviceCategory,
        targetLocation: input.targetLocation?.trim() || seo.targetLocation,
        businessProjectId:
          input.businessProjectId?.trim() || seo.businessProjectId,
        landingPageRefs: seo.landingPagesGenerated.map(
          (p) => p.urlRecommendation || p.pageId,
        ),
        keywordHints: seo.localKeywords.map((k) => k.phrase),
      };
    }
    if (input.fixtureLocalSeo) {
      const seo = input.fixtureLocalSeo;
      return {
        localSeo: seo,
        source: "fixtureLocalSeo",
        sourceSeoReportId: seo.reportId ?? "lseo-rpt-fixture-unknown",
        businessName: input.businessName?.trim() || seo.businessName || "Local Business",
        serviceCategory:
          input.serviceCategory?.trim() || seo.serviceCategory || "general",
        targetLocation:
          input.targetLocation?.trim() || seo.targetLocation || "unknown",
        businessProjectId:
          input.businessProjectId?.trim() ||
          seo.businessProjectId ||
          "lbfc-prj-unknown",
        landingPageRefs: (seo.landingPagesGenerated ?? []).map(
          (p) => p.urlRecommendation || p.pageId || "landing",
        ),
        keywordHints: (seo.localKeywords ?? [])
          .map((k) => k.phrase)
          .filter((p): p is string => !!p),
      };
    }
    return {
      localSeo: null,
      source: "none",
      sourceSeoReportId: input.seoReportId?.trim() || "lseo-rpt-unresolved",
      businessName: input.businessName?.trim() || "Local Business",
      serviceCategory: input.serviceCategory?.trim() || "general",
      targetLocation: input.targetLocation?.trim() || "unknown",
      businessProjectId:
        input.businessProjectId?.trim() || "lbfc-prj-unknown",
      landingPageRefs: input.landingPageRef ? [input.landingPageRef] : [],
      keywordHints: [],
    };
  }
}

export function scoreBand(value: number): LeadScore["band"] {
  if (value >= 0.7) return "high";
  if (value >= 0.4) return "medium";
  if (value > 0) return "low";
  return "unknown";
}
