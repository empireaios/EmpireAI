import type { LeadGenerationWorkerConfiguration } from "./configuration.js";
import {
  FunnelBuilder,
  nextEngineRecordId,
  nextRunReportId,
  normalizeConversionStage,
  normalizeQualification,
} from "./funnel-builder.js";
import { FunnelStore } from "./funnel-store.js";
import {
  IntegrationCoordinator,
  type LeadGenerationWorkerDependencies,
} from "./integrations.js";
import {
  autoQualify,
  provideCapturedLead,
  provideConversionStage,
  provideEnquiryForm,
  provideFunnelMetrics,
  provideLeadFunnel,
  provideLeadScore,
} from "./lead-providers.js";
import {
  HealthMonitor,
  LeadValidator,
  RecoveryManager,
} from "./lead-validator.js";
import { appendLgwLog } from "./lgw-logging.js";
import {
  INTEGRATION_TARGETS,
  LEAD_GENERATION_WORKER_ID,
  LGW_CAPABILITIES,
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
  LeadGenerationWorkerEngineRecord,
  LeadGenerationWorkerRunReport,
  OperationalState,
} from "./types.js";

export class LeadManager {
  private engineRecord: LeadGenerationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: LeadGenerationWorkerCatalog | null = null;
  private readonly store = new FunnelStore();
  private readonly builder = new FunnelBuilder();
  private readonly validator = new LeadValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: LeadGenerationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LeadGenerationWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listFunnels(),
      this.store.listForms(),
      this.store.listLeads(),
      this.store.listMetrics(),
      this.handshakes,
    );
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getFunnels() {
    return this.store.listFunnels();
  }

  getForms() {
    return this.store.listForms();
  }

  getLeads() {
    return this.store.listLeads();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getLatestFunnelId() {
    return this.store.getLatestFunnelId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: LeadGenerationWorkerConfiguration,
  ): LeadGenerationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.refreshCatalog(config);
    this.ensureRecord("connected", config);
    appendLgwLog({
      event: "connect",
      details: `Lead Generation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      this.validator.finalize("pass", [], [], started),
      started,
    );
  }

  createLeadFunnel(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.leadRulesEnabled) {
      return this.disabled(
        "create_lead_funnel",
        config,
        !config.enabled
          ? "Lead Generation Worker is disabled"
          : "Lead rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("create_lead_funnel", input, config, started);
    }

    const ctx = this.resolveContext(input);
    const funnel = provideLeadFunnel(input, config, {
      businessProjectId: ctx.businessProjectId,
      businessName: ctx.businessName,
      serviceCategory: ctx.serviceCategory,
      targetLocation: ctx.targetLocation,
      landingPageRefs: ctx.landingPageRefs,
      sourceSeoReportId:
        ctx.source === "none" && !input.seoReportId
          ? null
          : ctx.sourceSeoReportId,
    });
    const saved = this.store.saveFunnel(funnel, "create_lead_funnel");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendLgwLog({
      event: "create_lead_funnel",
      details: `funnel=${saved.funnelId} project=${saved.businessProjectId}`,
    });
    return this.report(
      "create_lead_funnel",
      this.getCatalog(),
      [],
      [saved],
      [],
      [],
      null,
      saved,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  generateEnquiryForm(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("generate_enquiry_form", input, config, started);
    }
    const funnel = this.requireFunnel(input);
    if (!funnel) {
      return this.failSimple(
        "generate_enquiry_form",
        config,
        started,
        "Lead Generation Worker requires an existing funnel to generate enquiry form",
      );
    }
    const form = provideEnquiryForm(input, funnel);
    const savedForm = this.store.saveForm(form, "generate_enquiry_form");
    const updatedFunnel = this.store.saveFunnel(
      {
        ...funnel,
        formIds: funnel.formIds.includes(savedForm.formId)
          ? funnel.formIds
          : [...funnel.formIds, savedForm.formId],
        updatedAt: new Date().toISOString(),
      },
      "link_form",
    );
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendLgwLog({
      event: "generate_enquiry_form",
      details: `form=${savedForm.formId} funnel=${updatedFunnel.funnelId}`,
    });
    return this.report(
      "generate_enquiry_form",
      this.getCatalog(),
      [],
      [updatedFunnel],
      [savedForm],
      [],
      null,
      updatedFunnel,
      savedForm,
      null,
      null,
      validation,
      started,
    );
  }

  captureLead(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.leadRulesEnabled) {
      return this.disabled(
        "capture_lead",
        config,
        !config.enabled
          ? "Lead Generation Worker is disabled"
          : "Lead rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("capture_lead", input, config, started);
    }

    let funnel = this.requireFunnel(input);
    if (!funnel) {
      const created = this.createLeadFunnel(input, config);
      funnel = created.latestFunnel;
    }
    if (!funnel) {
      return this.failSimple(
        "capture_lead",
        config,
        started,
        "Lead Generation Worker could not resolve or create a funnel for capture",
      );
    }

    let form =
      (input.formId?.trim()
        ? this.store.getForm(input.formId.trim())
        : null) ??
      this.store.formsForFunnel(funnel.funnelId)[0] ??
      null;
    if (!form) {
      const generated = this.generateEnquiryForm(
        { ...input, funnelId: funnel.funnelId },
        config,
      );
      form = generated.latestForm;
      funnel = generated.latestFunnel ?? funnel;
    }

    const lead = provideCapturedLead(input, funnel, form);
    const saved = this.store.saveLead(lead, "capture_lead");
    this.store.saveStage(
      provideConversionStage(saved, "enquiry", "Observed form/enquiry capture"),
      "capture_stage",
    );

    if (saved.leadSource === "whatsapp") {
      this.integrations.notifyWhatsAppInbound({
        customerReference: saved.leadId,
        messageBody: saved.message || saved.interest,
        businessProjectId: saved.businessProjectId,
        validated: true,
        source: "whatsapp",
      });
    }

    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendLgwLog({
      event: "capture_lead",
      details: `lead=${saved.leadId} funnel=${funnel.funnelId} source=${saved.leadSource}`,
    });
    return this.report(
      "capture_lead",
      this.getCatalog(),
      [],
      [funnel],
      form ? [form] : [],
      [saved],
      null,
      funnel,
      form,
      saved,
      null,
      validation,
      started,
    );
  }

  qualifyLead(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("qualify_lead", input, config, started);
    }
    const lead = this.requireLead(input);
    if (!lead) {
      return this.failSimple(
        "qualify_lead",
        config,
        started,
        "Lead Generation Worker requires an existing lead to qualify",
      );
    }
    const status = input.qualificationStatus
      ? normalizeQualification(input.qualificationStatus)
      : autoQualify(lead);
    const stage =
      status === "qualified"
        ? "qualified_lead"
        : status === "disqualified"
          ? "abandoned"
          : lead.conversionStage;
    const updated: CapturedLead = {
      ...lead,
      qualificationStatus: status,
      conversionStage: normalizeConversionStage(stage),
      updatedAt: new Date().toISOString(),
    };
    const saved = this.store.saveLead(updated, "qualify_lead");
    this.store.saveStage(
      provideConversionStage(saved, saved.conversionStage, `Qualified as ${status}`),
    );
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendLgwLog({
      event: "qualify_lead",
      details: `lead=${saved.leadId} status=${saved.qualificationStatus}`,
    });
    return this.report(
      "qualify_lead",
      this.getCatalog(),
      [],
      [],
      [],
      [saved],
      null,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  scoreLead(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("score_lead", input, config, started);
    }
    if (input.fabricateLeadOrConversionResults === true) {
      return this.boundaryFail("score_lead", input, config, started);
    }
    const lead = this.requireLead(input);
    if (!lead) {
      return this.failSimple(
        "score_lead",
        config,
        started,
        "Lead Generation Worker requires an existing lead to score",
      );
    }
    const score = provideLeadScore(lead);
    const saved = this.store.saveLead(
      { ...lead, score, updatedAt: new Date().toISOString() },
      "score_lead",
    );
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendLgwLog({
      event: "score_lead",
      details: `lead=${saved.leadId} score=${score.value} band=${score.band}`,
    });
    return this.report(
      "score_lead",
      this.getCatalog(),
      [],
      [],
      [],
      [saved],
      null,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  routeLeadToCrm(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("route_lead_to_crm", input, config, started);
    }
    if (input.replaceCrm === true) {
      return this.boundaryFail("route_lead_to_crm", input, config, started);
    }
    const lead = this.requireLead(input);
    if (!lead) {
      return this.failSimple(
        "route_lead_to_crm",
        config,
        started,
        "Lead Generation Worker requires an existing lead to route to CRM",
      );
    }
    const routed = this.integrations.routeToCrm({
      businessProjectId: lead.businessProjectId,
      contactName: lead.contactName,
      contactChannel: lead.contactChannel,
      interest: lead.interest,
      source: lead.leadSource,
      customerReference: lead.leadId,
      noteBody: lead.message,
      leadStatus: "new",
      validated: true,
    });
    const saved = this.store.saveLead(
      {
        ...lead,
        crmIntegrationStatus: routed.ok ? "routed" : "failed",
        crmLeadRef: routed.crmLeadRef,
        qualificationStatus: routed.ok
          ? "routed_to_crm"
          : lead.qualificationStatus,
        conversionStage: routed.ok ? "crm_captured" : lead.conversionStage,
        updatedAt: new Date().toISOString(),
      },
      "route_lead_to_crm",
    );
    if (routed.ok) {
      this.store.saveStage(
        provideConversionStage(saved, "crm_captured", routed.details),
      );
    }
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      routed.ok ? "pass" : "partial",
      [],
      routed.ok ? [] : [routed.details],
      started,
    );
    appendLgwLog({
      event: "route_lead_to_crm",
      details: `lead=${saved.leadId} status=${saved.crmIntegrationStatus}`,
    });
    return this.report(
      "route_lead_to_crm",
      this.getCatalog(),
      [],
      [],
      [],
      [saved],
      null,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  routeLeadToBooking(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("route_lead_to_booking", input, config, started);
    }
    if (input.replaceBookingWorker === true) {
      return this.boundaryFail("route_lead_to_booking", input, config, started);
    }
    const lead = this.requireLead(input);
    if (!lead) {
      return this.failSimple(
        "route_lead_to_booking",
        config,
        started,
        "Lead Generation Worker requires an existing lead to route to booking",
      );
    }
    const qualified =
      lead.qualificationStatus === "qualified" ||
      lead.qualificationStatus === "routed_to_crm" ||
      lead.qualificationStatus === "routed_to_booking" ||
      (lead.score != null && lead.score.value >= 0.4);
    if (!qualified) {
      const skipped = this.store.saveLead(
        {
          ...lead,
          bookingIntegrationStatus: "not_qualified",
          updatedAt: new Date().toISOString(),
        },
        "route_booking_skipped",
      );
      const validation = this.validator.finalize(
        "partial",
        [],
        ["Lead is not qualified for booking routing"],
        started,
      );
      return this.report(
        "route_lead_to_booking",
        this.getCatalog(),
        [],
        [],
        [],
        [skipped],
        null,
        null,
        null,
        skipped,
        null,
        validation,
        started,
      );
    }
    const routed = this.integrations.routeToBooking({
      businessProjectId: lead.businessProjectId,
      customerReference: lead.leadId,
      serviceSelected: lead.interest,
      contactName: lead.contactName,
      validated: true,
      structuralTrigger: true,
    });
    const saved = this.store.saveLead(
      {
        ...lead,
        bookingIntegrationStatus: routed.ok ? "routed" : "failed",
        bookingRef: routed.bookingRef,
        qualificationStatus: routed.ok
          ? "routed_to_booking"
          : lead.qualificationStatus,
        conversionStage: routed.ok ? "booking_requested" : lead.conversionStage,
        updatedAt: new Date().toISOString(),
      },
      "route_lead_to_booking",
    );
    if (routed.ok) {
      this.store.saveStage(
        provideConversionStage(saved, "booking_requested", routed.details),
      );
    }
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      routed.ok ? "pass" : "partial",
      [],
      routed.ok ? [] : [routed.details],
      started,
    );
    appendLgwLog({
      event: "route_lead_to_booking",
      details: `lead=${saved.leadId} status=${saved.bookingIntegrationStatus}`,
    });
    return this.report(
      "route_lead_to_booking",
      this.getCatalog(),
      [],
      [],
      [],
      [saved],
      null,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  trackConversionStage(
    input: LeadGenInput,
    config: LeadGenerationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("track_conversion_stage", input, config, started);
    }
    if (input.fabricateLeadOrConversionResults === true) {
      return this.boundaryFail("track_conversion_stage", input, config, started);
    }
    const lead = this.requireLead(input);
    if (!lead) {
      return this.failSimple(
        "track_conversion_stage",
        config,
        started,
        "Lead Generation Worker requires an existing lead to track conversion stage",
      );
    }
    const stage = normalizeConversionStage(
      input.conversionStage ?? lead.conversionStage,
    );
    const saved = this.store.saveLead(
      {
        ...lead,
        conversionStage: stage,
        updatedAt: new Date().toISOString(),
      },
      "track_conversion_stage",
    );
    this.store.saveStage(
      provideConversionStage(saved, stage, "Observed conversion stage update"),
    );
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    return this.report(
      "track_conversion_stage",
      this.getCatalog(),
      [],
      [],
      [],
      [saved],
      null,
      null,
      null,
      saved,
      null,
      validation,
      started,
    );
  }

  measureFunnelPerformance(
    input: LeadGenInput,
    config: LeadGenerationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(
        "measure_funnel_performance",
        input,
        config,
        started,
      );
    }
    if (input.fabricateLeadOrConversionResults === true) {
      return this.boundaryFail(
        "measure_funnel_performance",
        input,
        config,
        started,
      );
    }
    const funnel = this.requireFunnel(input);
    if (!funnel) {
      return this.failSimple(
        "measure_funnel_performance",
        config,
        started,
        "Lead Generation Worker requires an existing funnel to measure performance",
      );
    }
    const observed = this.store.leadsForFunnel(funnel.funnelId);
    const metrics = provideFunnelMetrics(funnel, observed);
    const savedMetrics = this.store.saveMetrics(metrics, "measure_funnel_performance");
    this.refreshCatalog(config);
    const validation = this.validator.validateInput(
      { ...input, validated: input.validated ?? true },
      started,
    );
    appendLgwLog({
      event: "measure_funnel_performance",
      details: `funnel=${funnel.funnelId} observed=${metrics.totalCapturedLeads}`,
    });
    return this.report(
      "measure_funnel_performance",
      this.getCatalog(),
      [],
      [funnel],
      [],
      observed,
      null,
      funnel,
      null,
      null,
      savedMetrics,
      validation,
      started,
    );
  }

  produceReport(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.leadRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled
          ? "Lead Generation Worker is disabled"
          : "Lead rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    let funnel = this.requireFunnel(input);
    if (!funnel) {
      const created = this.createLeadFunnel(input, config);
      if (created.validation.decision === "fail") {
        return created;
      }
      funnel = created.latestFunnel;
    }
    if (!funnel) {
      return this.failSimple(
        "produce_report",
        config,
        started,
        "Lead Generation Worker requires a funnel to produce a report",
      );
    }

    const forms = this.store.formsForFunnel(funnel.funnelId);
    if (!forms.length) {
      this.generateEnquiryForm({ ...input, funnelId: funnel.funnelId }, config);
    }
    const finalForms = this.store.formsForFunnel(funnel.funnelId);
    const leads = this.store.leadsForFunnel(funnel.funnelId);
    const metrics = provideFunnelMetrics(funnel, leads);
    this.store.saveMetrics(metrics, "produce_report_metrics");

    const ctx = this.resolveContext({
      ...input,
      funnelId: funnel.funnelId,
      businessProjectId: funnel.businessProjectId,
    });
    const outstanding: string[] = [];
    if (!leads.length) outstanding.push("No leads captured yet for this funnel");
    if (!funnel.sourceSeoReportId && ctx.source === "none") {
      outstanding.push("No Local SEO source report linked");
    }

    const confidence =
      leads.length === 0
        ? 0.35
        : Math.min(0.95, 0.5 + leads.length * 0.1 + (metrics.qualifiedCount > 0 ? 0.1 : 0));

    const reportDoc = this.builder.buildReport({
      funnel,
      forms: finalForms,
      leads,
      metrics,
      sourceSeoReportId: funnel.sourceSeoReportId || ctx.sourceSeoReportId,
      attribution: {
        leadSource: funnel.leadSourcePrimary,
        landingPageRef: funnel.landingPageRefs[0] ?? null,
        formId: finalForms[0]?.formId ?? null,
        seoKeywordHints: ctx.keywordHints,
        utmCampaign: input.utmCampaign?.trim() ?? null,
      },
      outstandingIssues: outstanding,
      confidenceScore: Math.round(confidence * 100) / 100,
      config,
      reportId: input.reportId?.trim() || undefined,
    });

    const saved = this.store.saveReport(reportDoc, "produce_report");
    this.refreshCatalog(config);
    const validation = this.validator.validateReports(
      [saved],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      saved,
    );
    appendLgwLog({
      event: "produce_report",
      details: `report=${saved.reportId} leads=${saved.capturedLeads.length}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [saved],
      [funnel],
      finalForms,
      leads,
      saved,
      funnel,
      finalForms[0] ?? null,
      leads[leads.length - 1] ?? null,
      metrics,
      validation,
      started,
    );
  }

  submitReport(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    let reportDoc =
      (input.reportId?.trim()
        ? this.store.getReport(input.reportId.trim())
        : null) ??
      (this.store.getLatestReportId()
        ? this.store.getReport(this.store.getLatestReportId()!)
        : null);
    if (!reportDoc) {
      const produced = this.produceReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) {
        return produced;
      }
      reportDoc = produced.latestReport;
    }
    const submission = this.integrations.submitReport(reportDoc);
    const updated: LeadGenerationReport = {
      ...reportDoc,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
      auditStatus: submission.submitted ? "submitted" : reportDoc.auditStatus,
    };
    const saved = this.store.saveReport(updated, "submit_report");
    this.refreshCatalog(config);
    const validation = this.validator.finalize(
      submission.submitted ? "pass" : "partial",
      [],
      submission.submitted ? [] : [submission.details],
      started,
    );
    this.ensureRecord("active", config, "passed", saved);
    return this.report(
      "submit_report",
      this.getCatalog(),
      [saved],
      [],
      [],
      [],
      saved,
      null,
      null,
      null,
      saved.funnelPerformanceSummary,
      validation,
      started,
    );
  }

  list(config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.refreshCatalog(config);
    return this.report(
      "list",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listFunnels(),
      this.store.listForms(),
      this.store.listLeads(),
      this.store.getLatestReportId()
        ? this.store.getReport(this.store.getLatestReportId()!)
        : null,
      this.store.getLatestFunnelId()
        ? this.store.getFunnel(this.store.getLatestFunnelId()!)
        : null,
      this.store.getLatestFormId()
        ? this.store.getForm(this.store.getLatestFormId()!)
        : null,
      this.store.getLatestLeadId()
        ? this.store.getLead(this.store.getLatestLeadId()!)
        : null,
      null,
      this.validator.finalize("pass", [], [], started),
      started,
    );
  }

  validate(input: LeadGenInput, config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const reports = this.store.listReports();
    const validation = this.validator.validateReports(
      reports,
      input,
      started,
      { allowIncompleteReport: reports.length === 0 },
    );
    return this.report(
      "validate",
      this.getCatalog(),
      reports,
      this.store.listFunnels(),
      this.store.listForms(),
      this.store.listLeads(),
      reports[reports.length - 1] ?? null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  diagnostics(config: LeadGenerationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "partial",
      [],
      config.enabled ? [] : ["Lead Generation Worker disabled"],
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listFunnels(),
      this.store.listForms(),
      this.store.listLeads(),
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private resolveContext(input: LeadGenInput) {
    let ctx = this.builder.resolveSeoContext(input);
    if (ctx.source === "none" && input.seoReportId?.trim()) {
      const resolved = this.integrations.resolveSeoById(input.seoReportId.trim());
      if (resolved) {
        ctx = this.builder.resolveSeoContext({
          ...input,
          localSeoReport: resolved,
          seoReportId: null,
        });
        return { ...ctx, source: "seoReportId" as const };
      }
    }
    return ctx;
  }

  private requireFunnel(input: LeadGenInput): LeadFunnel | null {
    const funnelId = input.funnelId?.trim() || this.store.getLatestFunnelId();
    return funnelId ? this.store.getFunnel(funnelId) : null;
  }

  private requireLead(input: LeadGenInput): CapturedLead | null {
    const leadId = input.leadId?.trim() || this.store.getLatestLeadId();
    return leadId ? this.store.getLead(leadId) : null;
  }

  private refreshCatalog(config: LeadGenerationWorkerConfiguration) {
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listFunnels(),
      this.store.listForms(),
      this.store.listLeads(),
      this.store.listMetrics(),
      this.handshakes,
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: LeadGenerationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: LeadGenerationReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed"
        ? "fail"
        : validationStatus === "partial"
          ? "partial"
          : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? nextEngineRecordId(),
      timestamp: new Date().toISOString(),
      engineId: LEAD_GENERATION_WORKER_ID,
      engineVersion: "PILLOW-LGW-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...LGW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalFunnels: this.store.funnelCount(),
      totalLeads: this.store.leadCount(),
      lastFunnelId: this.store.getLatestFunnelId(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LGW_METADATA_VERSION,
    };
  }

  private boundaryFail(
    action: LeadGenerationWorkerRunReport["action"],
    input: LeadGenInput,
    config: LeadGenerationWorkerConfiguration,
    started: number,
  ) {
    const errors = this.validator.collectBoundaryErrors(input);
    const boundaryOnly = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendLgwLog({
      event: action,
      details: `boundary_reject=${errors.join(";")}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      boundaryOnly,
      started,
    );
  }

  private failSimple(
    action: LeadGenerationWorkerRunReport["action"],
    config: LeadGenerationWorkerConfiguration,
    started: number,
    message: string,
  ) {
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private disabled(
    action: LeadGenerationWorkerRunReport["action"],
    config: LeadGenerationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.ensureRecord("failed", config, "failed");
    return this.report(
      action,
      this.getCatalog(),
      [],
      [],
      [],
      [],
      null,
      null,
      null,
      null,
      null,
      validation,
      started,
    );
  }

  private report(
    action: LeadGenerationWorkerRunReport["action"],
    catalog: LeadGenerationWorkerCatalog | null,
    reports: LeadGenerationReport[],
    funnels: LeadFunnel[],
    forms: EnquiryForm[],
    leads: CapturedLead[],
    latestReport: LeadGenerationReport | null,
    latestFunnel: LeadFunnel | null,
    latestForm: EnquiryForm | null,
    latestLead: CapturedLead | null,
    latestMetrics: FunnelMetrics | null,
    validation: LeadGenerationWorkerRunReport["validation"],
    started: number,
  ): LeadGenerationWorkerRunReport {
    return {
      lgwRunReportId: nextRunReportId(),
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.getEngineRecord()!,
      catalog,
      reports,
      funnels,
      forms,
      leads,
      latestReport,
      latestFunnel,
      latestForm,
      latestLead,
      latestMetrics,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: LGW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: LeadGenerationWorkerCatalog): LeadGenerationWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    funnels: catalog.funnels.map((f) => ({ ...f })),
    forms: catalog.forms.map((f) => ({ ...f })),
    leads: catalog.leads.map((l) => ({ ...l })),
    metrics: catalog.metrics.map((m) => ({ ...m })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
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
