import type { EmailFunnelWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type EmailFunnelWorkerDependencies } from "./integrations.js";
import { appendEfwLog } from "./efw-logging.js";
import {
  EFW_METADATA_VERSION,
  EMAIL_FUNNEL_REPORT_VERSION,
  EMAIL_FUNNEL_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  buildCaptureStrategy,
  buildCtaStrategy,
  buildFunnelStages,
  buildLeadMagnet,
  buildNurtureSequence,
  buildWelcomeSequence,
  computeConfidence,
  resolveFunnelName,
  resolveOpportunity,
  resolveReview,
  resolveSeo,
  resolveTopic,
} from "./funnel-providers.js";
import { FunnelStore, nextReportId, nextSessionId } from "./funnel-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./funnel-validator.js";
import type {
  EfwInput,
  EfwRunReport,
  EmailFunnelReport,
  EmailFunnelWorkerCatalog,
  FunnelSession,
  Q807ConsumableContract,
} from "./types.js";

function resolveIds(input: EfwInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const seo = resolveSeo(input) ?? integrations.resolveSeoReport();
  const review = resolveReview(input) ?? integrations.resolveReviewReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    seo?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    seo?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity, seo, review };
}

function fail(action: string, errors: string[]): EfwRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class FunnelManager {
  private readonly store = new FunnelStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: EmailFunnelWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: EmailFunnelWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendEfwLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: EmailFunnelWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Email Funnel Worker connected"],
    };
  }

  private ensureSession(input: EfwInput, config: EmailFunnelWorkerConfiguration): FunnelSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity, seo, review } = resolveIds(
      input,
      this.integrations,
    );
    const topic = resolveTopic({
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      seoReport: input.seoReport ?? seo,
      reviewReport: input.reviewReport ?? review,
    });
    const funnelName = resolveFunnelName(input, topic);
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.funnelName === funnelName &&
      !input.fixtureLeadMagnetName
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: FunnelSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      funnelName,
      topic,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      sourceSeoReportId: seo?.reportId ?? null,
      leadMagnet: null,
      emailCaptureStrategy: null,
      funnelStages: [],
      welcomeSequence: null,
      nurtureSequence: null,
      emailSequence: [],
      callToActionStrategy: null,
      conversionObjectives: [],
      versionHistory: [],
      outstandingIssues: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: EfwInput, config: EmailFunnelWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: FunnelSession, input: EfwInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    if (seo?.reportId) session.sourceSeoReportId = seo.reportId;

    const merged: EfwInput = {
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      seoReport: input.seoReport ?? seo,
      reviewReport: input.reviewReport ?? review,
    };
    session.topic = resolveTopic(merged);
    session.funnelName = resolveFunnelName(merged, session.topic);

    if (!session.leadMagnet || input.fixtureLeadMagnetName) {
      session.leadMagnet = buildLeadMagnet(session.topic, merged, seo, review);
    }
    if (!session.emailCaptureStrategy) {
      session.emailCaptureStrategy = buildCaptureStrategy(session.topic, session.leadMagnet, seo);
    }
    if (!session.funnelStages.length) {
      session.funnelStages = buildFunnelStages(session.topic);
    }
    if (!session.welcomeSequence) {
      session.welcomeSequence = buildWelcomeSequence(session.topic, session.leadMagnet, review);
    }
    if (!session.nurtureSequence) {
      session.nurtureSequence = buildNurtureSequence(session.topic, seo, review);
    }
    session.emailSequence = [session.welcomeSequence, session.nurtureSequence];
    if (!session.callToActionStrategy) {
      session.callToActionStrategy = buildCtaStrategy(session.topic, session.leadMagnet, review);
    }
    session.conversionObjectives = [...session.callToActionStrategy.conversionObjectives];

    session.outstandingIssues = [];
    if (!session.sourceOpportunityReportId && !session.sourceSeoReportId) {
      session.outstandingIssues.push("No source opportunity/SEO report linked");
    }
    if (!session.leadMagnet.evidenceBasis.length) {
      session.outstandingIssues.push("Lead magnet evidence basis thin");
    }
  }

  consumeAffiliateOpportunityReport(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_affiliate_opportunity_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    session.sourceOpportunityReportId = opportunity?.reportId ?? null;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_affiliate_opportunity_report",
      validation: {
        decision: opportunity ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: opportunity
          ? []
          : ["No opportunity report available — funnel may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: opportunity
        ? [`Consumed opportunity report ${opportunity.reportId ?? "fixture"}`]
        : ["No opportunity report bound"],
    };
  }

  consumeSeoContentReport(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_seo_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    session.sourceSeoReportId = seo?.reportId ?? null;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_seo_content_report",
      validation: {
        decision: seo ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: seo ? [] : ["No SEO report available — funnel may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: seo
        ? [`Consumed SEO report ${seo.reportId ?? "fixture"}`]
        : ["No SEO report bound"],
    };
  }

  generateLeadMagnet(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_lead_magnet");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_lead_magnet",
      validation: {
        decision: session.leadMagnet ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      leadMagnet: session.leadMagnet,
      notes: [`Lead magnet ${session.leadMagnet?.magnetId ?? "none"}`],
    };
  }

  generateEmailCaptureStrategy(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_email_capture_strategy");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_email_capture_strategy",
      validation: {
        decision: session.emailCaptureStrategy ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      emailCaptureStrategy: session.emailCaptureStrategy,
      notes: [`Capture strategy ${session.emailCaptureStrategy?.strategyId ?? "none"}`],
    };
  }

  defineFunnelStages(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "define_funnel_stages");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "define_funnel_stages",
      validation: {
        decision: session.funnelStages.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      funnelStages: session.funnelStages,
      notes: [`${session.funnelStages.length} funnel stage(s)`],
    };
  }

  generateWelcomeSequence(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_welcome_sequence");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_welcome_sequence",
      validation: {
        decision: session.welcomeSequence ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      welcomeSequence: session.welcomeSequence,
      notes: [`Welcome sequence ${session.welcomeSequence?.sequenceId ?? "none"}`],
    };
  }

  generateNurtureSequence(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_nurture_sequence");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_nurture_sequence",
      validation: {
        decision: session.nurtureSequence ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      nurtureSequence: session.nurtureSequence,
      notes: [`Nurture sequence ${session.nurtureSequence?.sequenceId ?? "none"}`],
    };
  }

  generateCallToActionStrategy(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_call_to_action_strategy");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_call_to_action_strategy",
      validation: {
        decision: session.callToActionStrategy ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      callToActionStrategy: session.callToActionStrategy,
      notes: [`CTA strategy ${session.callToActionStrategy?.strategyId ?? "none"}`],
    };
  }

  produceEmailFunnelReport(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_email_funnel_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (
      !session.leadMagnet ||
      !session.emailCaptureStrategy ||
      !session.welcomeSequence ||
      !session.nurtureSequence ||
      !session.callToActionStrategy
    ) {
      return fail("produce_email_funnel_report", [
        "Unable to produce report — funnel assets missing from evidence",
      ]);
    }

    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();

    const confidenceScore = computeConfidence({
      hasMagnet: Boolean(session.leadMagnet),
      hasCapture: Boolean(session.emailCaptureStrategy),
      hasStages: session.funnelStages.length > 0,
      hasWelcome: Boolean(session.welcomeSequence),
      hasNurture: Boolean(session.nurtureSequence),
      hasCta: Boolean(session.callToActionStrategy),
      hasSourceLink: Boolean(
        session.sourceOpportunityReportId ||
          session.sourceSeoReportId ||
          opportunity ||
          seo,
      ),
    });

    const now = new Date().toISOString();
    const nextVersion = (session.versionHistory.at(-1)?.version ?? 0) + 1;
    const versionEntry = {
      version: nextVersion,
      funnelId: session.sessionId,
      reportId: null as string | null,
      timestamp: now,
      changeSummary: `Funnel v${nextVersion} for ${session.funnelName}`,
    };

    const cloneSequence = (seq: typeof session.welcomeSequence) => ({
      ...seq!,
      emails: seq!.emails.map((e) => ({
        ...e,
        bodyOutline: [...e.bodyOutline],
        fabricated: false as const,
      })),
      fabricated: false as const,
    });

    const report: EmailFunnelReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      funnelName: session.funnelName,
      leadMagnet: {
        ...session.leadMagnet,
        evidenceBasis: [...session.leadMagnet.evidenceBasis],
        fabricated: false,
      },
      funnelStages: session.funnelStages.map((s) => ({ ...s })),
      emailSequence: session.emailSequence.map((seq) => cloneSequence(seq)),
      callToActionStrategy: {
        ...session.callToActionStrategy,
        secondaryCtas: [...session.callToActionStrategy.secondaryCtas],
        placementByStage: session.callToActionStrategy.placementByStage.map((p) => ({ ...p })),
        conversionObjectives: [...session.callToActionStrategy.conversionObjectives],
        fabricated: false,
        neverFabricatePerformanceClaims: true,
      },
      conversionObjectives: [...session.conversionObjectives],
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceSeoReportId ? [`seo_content_report:${session.sourceSeoReportId}`] : []),
        ...(input.fixtureLeadMagnetName ? ["fixtureLeadMagnetName"] : []),
        "lead_magnet",
        "email_capture_strategy",
        "welcome_sequence",
        "nurture_sequence",
        "cta_strategy",
        "version_history",
      ],
      auditStatus: confidenceScore >= 0.8 ? "ready_for_q807" : "sequences_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: EFW_METADATA_VERSION,
      reportVersion: EMAIL_FUNNEL_REPORT_VERSION,
      workerId: config.workerId || EMAIL_FUNNEL_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      topic: session.topic,
      emailCaptureStrategy: {
        ...session.emailCaptureStrategy,
        formFields: [...session.emailCaptureStrategy.formFields],
        placementNotes: [...session.emailCaptureStrategy.placementNotes],
        fabricated: false,
      },
      welcomeSequence: cloneSequence(session.welcomeSequence),
      nurtureSequence: cloneSequence(session.nurtureSequence),
      versionHistory: [],
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      sourceSeoReportId: session.sourceSeoReportId,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ807: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-06:affiliate_business:${session.affiliateBusinessId}`,
        `q8-06:affiliate_project:${session.affiliateProjectId}`,
        `q8-06:funnel:${session.funnelName}`,
        `q8-06:magnet:${session.leadMagnet.magnetId}`,
        `q8-06:version:${nextVersion}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceSeoReportId ? [`q8-05:seo:${session.sourceSeoReportId}`] : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverFabricateConversionOrPerformanceClaims: true,
      neverSendLiveMarketingEmails: true,
      neverManageEmailInfrastructure: true,
      neverReplaceAnalyticsWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ807OrLater: true,
    };

    versionEntry.reportId = report.reportId;
    report.versionHistory = [
      ...session.versionHistory.map((v) => ({ ...v })),
      versionEntry,
    ];
    session.versionHistory = report.versionHistory.map((v) => ({ ...v }));
    this.store.appendVersion(versionEntry);

    const shapeErrors = validateReportShape(report);
    if (shapeErrors.length) {
      report.validation = { decision: "fail", errors: shapeErrors, warnings: [] };
    } else if (confidenceScore < 0.5 || session.outstandingIssues.length) {
      report.validation = {
        decision: "partial",
        errors: [],
        warnings: [
          ...(confidenceScore < 0.5 ? ["Low confidence due to incomplete evidence"] : []),
          ...session.outstandingIssues,
        ],
      };
    }

    this.store.saveReport(report);
    session.updatedAt = now;
    this.store.saveSession(session);
    appendEfwLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; funnel=${report.funnelName}`,
    });

    return {
      action: "produce_email_funnel_report",
      validation: report.validation,
      latestReport: report,
      leadMagnet: report.leadMagnet,
      emailCaptureStrategy: report.emailCaptureStrategy,
      funnelStages: report.funnelStages,
      welcomeSequence: report.welcomeSequence,
      nurtureSequence: report.nurtureSequence,
      emailSequence: report.emailSequence,
      callToActionStrategy: report.callToActionStrategy,
      versionHistory: report.versionHistory,
      notes: ["Email Funnel Report produced from opportunity/SEO/review evidence only"],
    };
  }

  produceReport(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    return this.produceEmailFunnelReport(input, config);
  }

  submitReport(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceEmailFunnelReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: EmailFunnelReport = {
      ...report,
      submittedToExecutiveReporting: submitted,
      executiveReportId,
      auditStatus: submitted ? "submitted" : report.auditStatus,
    };
    this.store.saveReport(updated);
    return {
      action: "submit_report",
      validation: {
        decision: submitted ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: submitted ? [] : ["ERR not injected — report retained locally only"],
      },
      latestReport: updated,
      notes: submitted
        ? [`Submitted to ERR as ${executiveReportId}`]
        : ["Executive Reporting Runtime not available"],
    };
  }

  list() {
    return {
      action: "list",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: [`${this.store.listReports().length} report(s)`],
      reports: this.store.listReports(),
    };
  }

  validate(input: EfwInput, config: EmailFunnelWorkerConfiguration) {
    const boundary = validateBoundaryInput(input);
    const report = this.store.getLatestReport();
    const shapeErrors = report ? validateReportShape(report) : [];
    const errors = [...boundary.errors, ...shapeErrors];
    return {
      action: "validate",
      validation: {
        decision: errors.length ? ("fail" as const) : ("pass" as const),
        errors,
        warnings: boundary.warnings,
      },
      latestReport: report,
      notes: errors.length ? errors : ["Validation passed"],
      configurationEnabled: config.enabled,
    };
  }

  diagnostics() {
    const record = this.store.getEngineRecord();
    return {
      action: "diagnostics",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: [
        `reports=${record.totalReports}`,
        `funnels=${record.totalFunnels}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): EmailFunnelWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: EMAIL_FUNNEL_WORKER_IDENTITY.workerId,
      workerName: EMAIL_FUNNEL_WORKER_IDENTITY.workerName,
      capabilities: [...EMAIL_FUNNEL_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalFunnels: record.totalFunnels,
    };
  }

  getQ807ConsumableContract(): Q807ConsumableContract {
    return {
      contractVersion: "EFW-Q807-v1",
      consumableByQ807: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "funnelName",
        "topic",
        "leadMagnet",
        "funnelStages",
        "emailSequence",
        "welcomeSequence",
        "nurtureSequence",
        "callToActionStrategy",
        "conversionObjectives",
        "emailCaptureStrategy",
        "versionHistory",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
        "sourceOpportunityReportId",
        "sourceSeoReportId",
      ] as const,
      types: {
        EmailFunnelReport: "EmailFunnelReport",
        LeadMagnet: "LeadMagnet",
        EmailSequence: "EmailSequence",
        CallToActionStrategy: "CallToActionStrategy",
      },
      notes: [
        "Q8-07 Analytics Worker may consume email funnel packages only.",
        "Sequences and CTAs reflect opportunity/SEO/review evidence — never fabricated conversion rates.",
        "EFW never sends live emails, manages email infrastructure, or replaces Analytics Worker.",
      ],
      neverFabricateConversionOrPerformanceClaims: true,
      neverSendLiveMarketingEmails: true,
      neverManageEmailInfrastructure: true,
      neverReplaceAnalyticsWorker: true,
    };
  }
}
