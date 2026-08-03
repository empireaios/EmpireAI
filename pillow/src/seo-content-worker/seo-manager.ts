import type { SeoContentWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type SeoContentWorkerDependencies } from "./integrations.js";
import { appendSeowLog } from "./seow-logging.js";
import {
  INTEGRATION_TARGETS,
  SEO_CONTENT_REPORT_VERSION,
  SEO_CONTENT_WORKER_IDENTITY,
  SEOW_METADATA_VERSION,
} from "./paths.js";
import {
  buildArticleBrief,
  buildContentPlan,
  buildInternalLinks,
  buildKeywordMapping,
  buildSeoArticle,
  computeConfidence,
  evaluateCompleteness,
  resolveOpportunity,
  resolveReview,
  resolveTopic,
} from "./seo-providers.js";
import { nextReportId, nextSessionId, SeoStore } from "./seo-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./seo-validator.js";
import type {
  Q806ConsumableContract,
  SeoContentReport,
  SeoContentWorkerCatalog,
  SeoSession,
  SeowInput,
  SeowRunReport,
} from "./types.js";

function resolveIds(input: SeowInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const review = resolveReview(input) ?? integrations.resolveReviewReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    review?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    review?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity, review };
}

function fail(action: string, errors: string[]): SeowRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class SeoManager {
  private readonly store = new SeoStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: SeoContentWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: SeoContentWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendSeowLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: SeoContentWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["SEO Content Worker connected"],
    };
  }

  private ensureSession(input: SeowInput, config: SeoContentWorkerConfiguration): SeoSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity, review } = resolveIds(
      input,
      this.integrations,
    );
    const topic = resolveTopic({
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      reviewReport: input.reviewReport ?? review,
    });
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.topic === topic &&
      !(input.fixtureKeywords && input.fixtureKeywords.length)
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: SeoSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      topic,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      sourceReviewReportId: review?.reportId ?? null,
      contentPlan: null,
      targetKeywords: [],
      searchIntent: "unknown",
      articleBrief: null,
      seoArticle: null,
      internalLinkingPlan: [],
      contentQualitySummary: null,
      versionHistory: [],
      outstandingIssues: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: SeowInput, config: SeoContentWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: SeoSession, input: SeowInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    if (review?.reportId) session.sourceReviewReportId = review.reportId;

    const merged: SeowInput = {
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      reviewReport: input.reviewReport ?? review,
    };
    session.topic = resolveTopic(merged);

    if (!session.targetKeywords.length || (input.fixtureKeywords?.length ?? 0) > 0) {
      session.targetKeywords = buildKeywordMapping(merged, session.topic);
    }
    session.searchIntent = session.targetKeywords[0]?.intent ?? "unknown";

    if (!session.contentPlan) {
      session.contentPlan = buildContentPlan(session.topic, session.targetKeywords, merged);
    }
    if (!session.articleBrief && session.contentPlan) {
      session.articleBrief = buildArticleBrief(
        session.topic,
        session.targetKeywords,
        session.contentPlan,
        review,
      );
    }
    const nextVersion = (session.versionHistory.at(-1)?.version ?? 0) + 1;
    if (!session.seoArticle && session.articleBrief) {
      session.seoArticle = buildSeoArticle(
        session.topic,
        session.articleBrief,
        review,
        nextVersion,
      );
    }
    if (!session.internalLinkingPlan.length && session.contentPlan && session.articleBrief) {
      session.internalLinkingPlan = buildInternalLinks(
        session.contentPlan,
        session.articleBrief,
        session.targetKeywords,
      );
    }
    session.contentQualitySummary = evaluateCompleteness({
      plan: session.contentPlan,
      brief: session.articleBrief,
      article: session.seoArticle,
      keywords: session.targetKeywords,
      links: session.internalLinkingPlan,
    });

    session.outstandingIssues = [...(session.contentQualitySummary?.issues ?? [])];
    if (!session.sourceOpportunityReportId && !session.sourceReviewReportId) {
      session.outstandingIssues.push("No source opportunity/review report linked");
    }
  }

  consumeAffiliateOpportunityReport(input: SeowInput, config: SeoContentWorkerConfiguration) {
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
          : ["No opportunity report available — SEO may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: opportunity
        ? [`Consumed opportunity report ${opportunity.reportId ?? "fixture"}`]
        : ["No opportunity report bound"],
    };
  }

  consumeReviewContentReport(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_review_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();
    session.sourceReviewReportId = review?.reportId ?? null;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_review_content_report",
      validation: {
        decision: review ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: review
          ? []
          : ["No review report available — SEO may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: review
        ? [`Consumed review report ${review.reportId ?? "fixture"}`]
        : ["No review report bound"],
    };
  }

  generateSeoContentPlan(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_seo_content_plan");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_seo_content_plan",
      validation: {
        decision: session.contentPlan ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      contentPlan: session.contentPlan,
      notes: [`Content plan ${session.contentPlan?.planId ?? "none"}`],
    };
  }

  generateKeywordMapping(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_keyword_mapping");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_keyword_mapping",
      validation: {
        decision: session.targetKeywords.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.targetKeywords.length ? [] : ["No keywords evidenced"],
      },
      latestReport: this.store.getLatestReport(),
      targetKeywords: session.targetKeywords,
      notes: [`${session.targetKeywords.length} keyword(s) mapped`],
    };
  }

  generateArticleBrief(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_article_brief");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_article_brief",
      validation: {
        decision: session.articleBrief ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      articleBrief: session.articleBrief,
      notes: [`Article brief ${session.articleBrief?.briefId ?? "none"}`],
    };
  }

  generateSeoArticle(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_seo_article");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_seo_article",
      validation: {
        decision: session.seoArticle ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      seoArticle: session.seoArticle,
      notes: [`SEO article ${session.seoArticle?.articleId ?? "none"}`],
    };
  }

  generateInternalLinkingPlan(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_internal_linking_plan");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_internal_linking_plan",
      validation: {
        decision: session.internalLinkingPlan.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      internalLinkingPlan: session.internalLinkingPlan,
      notes: [`${session.internalLinkingPlan.length} internal link recommendation(s)`],
    };
  }

  evaluateContentCompleteness(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "evaluate_content_completeness");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "evaluate_content_completeness",
      validation: {
        decision: session.contentQualitySummary ? ("pass" as const) : ("fail" as const),
        errors: session.contentQualitySummary ? [] : ["Quality summary missing"],
        warnings: session.contentQualitySummary?.issues ?? [],
      },
      latestReport: this.store.getLatestReport(),
      contentQualitySummary: session.contentQualitySummary,
      notes: [
        `completeness=${session.contentQualitySummary?.completenessScore ?? 0}`,
      ],
    };
  }

  produceSeoContentReport(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_seo_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (
      !session.contentPlan ||
      !session.articleBrief ||
      !session.seoArticle ||
      !session.contentQualitySummary
    ) {
      return fail("produce_seo_content_report", [
        "Unable to produce report — SEO assets missing from evidence",
      ]);
    }

    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();

    const confidenceScore = computeConfidence({
      hasPlan: Boolean(session.contentPlan),
      hasBrief: Boolean(session.articleBrief),
      hasArticle: Boolean(session.seoArticle),
      hasKeywords: session.targetKeywords.length > 0,
      hasLinks: session.internalLinkingPlan.length > 0,
      hasSourceLink: Boolean(
        session.sourceOpportunityReportId ||
          session.sourceReviewReportId ||
          opportunity ||
          review,
      ),
      completeness: session.contentQualitySummary.completenessScore,
    });

    const now = new Date().toISOString();
    const versionEntry = {
      version: session.seoArticle.version,
      articleId: session.seoArticle.articleId,
      reportId: null as string | null,
      timestamp: now,
      changeSummary: `SEO article v${session.seoArticle.version} for ${session.topic}`,
    };

    const report: SeoContentReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      contentPlan: {
        ...session.contentPlan,
        clusters: session.contentPlan.clusters.map((c) => ({
          ...c,
          supportingTopics: [...c.supportingTopics],
        })),
        supportingArticles: [...session.contentPlan.supportingArticles],
        targetKeywords: [...session.contentPlan.targetKeywords],
        notes: [...session.contentPlan.notes],
        fabricated: false,
      },
      targetKeywords: session.targetKeywords.map((k) => ({ ...k, fabricated: false })),
      searchIntent: session.searchIntent,
      articleBrief: {
        ...session.articleBrief,
        secondaryKeywords: [...session.articleBrief.secondaryKeywords],
        outline: [...session.articleBrief.outline],
        faqPrompts: [...session.articleBrief.faqPrompts],
        evidenceNotes: [...session.articleBrief.evidenceNotes],
        fabricated: false,
      },
      seoArticle: {
        ...session.seoArticle,
        headingStructure: [...session.seoArticle.headingStructure],
        bodySections: session.seoArticle.bodySections.map((s) => ({ ...s })),
        faqs: session.seoArticle.faqs.map((f) => ({ ...f })),
        fabricated: false,
      },
      internalLinkingPlan: session.internalLinkingPlan.map((l) => ({
        ...l,
        fabricated: false,
      })),
      contentQualitySummary: {
        ...session.contentQualitySummary,
        issues: [...session.contentQualitySummary.issues],
        notes: [...session.contentQualitySummary.notes],
      },
      auditStatus:
        session.contentQualitySummary.completenessScore >= 0.8
          ? "ready_for_q806"
          : "article_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: SEOW_METADATA_VERSION,
      reportVersion: SEO_CONTENT_REPORT_VERSION,
      workerId: config.workerId || SEO_CONTENT_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      topic: session.topic,
      versionHistory: [],
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      sourceReviewReportId: session.sourceReviewReportId,
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceReviewReportId
          ? [`review_content_report:${session.sourceReviewReportId}`]
          : []),
        ...(input.fixtureKeywords?.length ? ["fixtureKeywords"] : []),
        "content_plan",
        "keyword_mapping",
        "article_brief",
        "seo_article",
        "internal_linking_plan",
        "version_history",
      ],
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ806: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-05:affiliate_business:${session.affiliateBusinessId}`,
        `q8-05:affiliate_project:${session.affiliateProjectId}`,
        `q8-05:topic:${session.topic}`,
        `q8-05:article:${session.seoArticle.articleId}`,
        `q8-05:version:${session.seoArticle.version}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceReviewReportId
          ? [`q8-04:review:${session.sourceReviewReportId}`]
          : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverFabricateSeoPerformanceClaims: true,
      neverPublishArticles: true,
      neverManipulateSearchRankings: true,
      neverReplaceAnalyticsWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ806OrLater: true,
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
    appendSeowLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; topic=${report.topic}`,
    });

    return {
      action: "produce_seo_content_report",
      validation: report.validation,
      latestReport: report,
      contentPlan: report.contentPlan,
      articleBrief: report.articleBrief,
      seoArticle: report.seoArticle,
      targetKeywords: report.targetKeywords,
      internalLinkingPlan: report.internalLinkingPlan,
      contentQualitySummary: report.contentQualitySummary,
      versionHistory: report.versionHistory,
      notes: ["SEO Content Report produced from opportunity/review/fixture evidence only"],
    };
  }

  produceReport(input: SeowInput, config: SeoContentWorkerConfiguration) {
    return this.produceSeoContentReport(input, config);
  }

  submitReport(input: SeowInput, config: SeoContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceSeoContentReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: SeoContentReport = {
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

  validate(input: SeowInput, config: SeoContentWorkerConfiguration) {
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
        `articles=${record.totalArticles}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): SeoContentWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: SEO_CONTENT_WORKER_IDENTITY.workerId,
      workerName: SEO_CONTENT_WORKER_IDENTITY.workerName,
      capabilities: [...SEO_CONTENT_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalArticles: record.totalArticles,
    };
  }

  getQ806ConsumableContract(): Q806ConsumableContract {
    return {
      contractVersion: "SEOW-Q806-v1",
      consumableByQ806: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "topic",
        "contentPlan",
        "targetKeywords",
        "searchIntent",
        "articleBrief",
        "seoArticle",
        "internalLinkingPlan",
        "contentQualitySummary",
        "versionHistory",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
        "sourceOpportunityReportId",
        "sourceReviewReportId",
      ] as const,
      types: {
        SeoContentReport: "SeoContentReport",
        SeoContentPlan: "SeoContentPlan",
        ArticleBrief: "ArticleBrief",
        SeoArticle: "SeoArticle",
      },
      notes: [
        "Q8-06 Email Funnel Worker may consume SEO content packages only.",
        "Plans, briefs, and articles reflect opportunity/review evidence — never fabricated performance claims.",
        "SEOW never publishes articles, manipulates rankings, or replaces Analytics Worker.",
      ],
      neverFabricateSeoPerformanceClaims: true,
      neverPublishArticles: true,
      neverManipulateSearchRankings: true,
      neverReplaceAnalyticsWorker: true,
    };
  }
}
