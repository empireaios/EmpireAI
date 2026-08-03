import type { ReviewContentWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type ReviewContentWorkerDependencies } from "./integrations.js";
import { appendRcwLog } from "./rcw-logging.js";
import {
  INTEGRATION_TARGETS,
  RCW_METADATA_VERSION,
  REVIEW_CONTENT_REPORT_VERSION,
  REVIEW_CONTENT_WORKER_IDENTITY,
} from "./paths.js";
import {
  buildAlternatives,
  buildBuyingRecommendation,
  buildIdealCustomerProfile,
  buildLimitations,
  buildProsCons,
  buildReviewArticle,
  computeConfidence,
  resolveComparison,
  resolveOpportunity,
  resolveSubject,
} from "./review-providers.js";
import { nextReportId, nextSessionId, ReviewStore } from "./review-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./review-validator.js";
import type {
  ReviewContentReport,
  ReviewContentWorkerCatalog,
  ReviewSession,
  RcwInput,
  RcwRunReport,
  Q805ConsumableContract,
} from "./types.js";

function resolveIds(input: RcwInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const comparison = resolveComparison(input) ?? integrations.resolveComparisonReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    comparison?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity, comparison };
}

function fail(action: string, errors: string[]): RcwRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class ReviewManager {
  private readonly store = new ReviewStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: ReviewContentWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: ReviewContentWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendRcwLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: ReviewContentWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Review Content Worker connected"],
    };
  }

  private ensureSession(
    input: RcwInput,
    config: ReviewContentWorkerConfiguration,
  ): ReviewSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity, comparison } = resolveIds(
      input,
      this.integrations,
    );
    const subject = resolveSubject({
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      comparisonReport: input.comparisonReport ?? comparison,
    });
    const productId =
      input.productId?.trim() ||
      subject?.productId ||
      "unknown-product";
    const productName =
      input.productOrServiceReviewed?.trim() ||
      subject?.name ||
      "unknown";
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.productId === productId &&
      !input.fixtureProduct
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: ReviewSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      productId,
      productOrServiceReviewed: productName,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      sourceComparisonReportId: comparison?.reportId ?? null,
      subject: null,
      alternatives: [],
      reviewArticle: null,
      prosCons: null,
      buyingRecommendation: null,
      idealCustomerProfile: null,
      limitations: null,
      versionHistory: [],
      outstandingIssues: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: RcwInput, config: ReviewContentWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: ReviewSession, input: RcwInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const comparison =
      resolveComparison(input) ?? this.integrations.resolveComparisonReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    if (comparison?.reportId) session.sourceComparisonReportId = comparison.reportId;

    const merged: RcwInput = {
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      comparisonReport: input.comparisonReport ?? comparison,
    };

    if (!session.subject || input.fixtureProduct) {
      session.subject = resolveSubject(merged);
      if (session.subject) {
        session.productId = session.subject.productId;
        session.productOrServiceReviewed = session.subject.name;
      }
    }
    if (!session.subject) {
      session.outstandingIssues = ["No product/service subject available from evidence"];
      return;
    }

    if (!session.prosCons) session.prosCons = buildProsCons(session.subject);
    if (!session.alternatives.length) {
      session.alternatives = buildAlternatives(session.subject, merged);
    }
    if (!session.buyingRecommendation) {
      session.buyingRecommendation = buildBuyingRecommendation(
        session.subject,
        session.prosCons,
        opportunity,
        comparison,
      );
    }
    if (!session.idealCustomerProfile) {
      session.idealCustomerProfile = buildIdealCustomerProfile(session.subject);
    }
    if (!session.limitations) {
      session.limitations = buildLimitations(session.subject, session.prosCons);
    }
    const nextVersion = (session.versionHistory.at(-1)?.version ?? 0) + 1;
    if (!session.reviewArticle) {
      session.reviewArticle = buildReviewArticle(
        session.subject,
        session.prosCons,
        session.buyingRecommendation,
        session.idealCustomerProfile,
        session.limitations,
        nextVersion,
      );
    }

    session.outstandingIssues = [];
    if (session.prosCons.pros[0] === "No pros evidenced") {
      session.outstandingIssues.push("Pros not evidenced");
    }
    if (session.prosCons.cons[0] === "No cons evidenced") {
      session.outstandingIssues.push("Cons not evidenced");
    }
    if (!session.alternatives.length) {
      session.outstandingIssues.push("No alternatives evidenced");
    }
    if (!session.sourceOpportunityReportId && !session.sourceComparisonReportId) {
      session.outstandingIssues.push("No source opportunity/comparison report linked");
    }
  }

  consumeAffiliateOpportunityReport(input: RcwInput, config: ReviewContentWorkerConfiguration) {
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
          : ["No opportunity report available — review may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: opportunity
        ? [`Consumed opportunity report ${opportunity.reportId ?? "fixture"}`]
        : ["No opportunity report bound"],
    };
  }

  consumeComparisonSiteReport(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_comparison_site_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const comparison =
      resolveComparison(input) ?? this.integrations.resolveComparisonReport();
    session.sourceComparisonReportId = comparison?.reportId ?? null;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_comparison_site_report",
      validation: {
        decision: comparison ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: comparison
          ? []
          : ["No comparison report available — review may use fixtures only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: comparison
        ? [`Consumed comparison report ${comparison.reportId ?? "fixture"}`]
        : ["No comparison report bound"],
    };
  }

  generateReviewArticle(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_review_article");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_review_article",
      validation: {
        decision: session.reviewArticle ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.outstandingIssues,
      },
      latestReport: this.store.getLatestReport(),
      reviewArticle: session.reviewArticle,
      notes: [`Review article ${session.reviewArticle?.articleId ?? "none"}`],
    };
  }

  generateProsAndCons(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_pros_and_cons");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_pros_and_cons",
      validation: {
        decision: session.prosCons ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      prosCons: session.prosCons,
      notes: [`Pros/cons ${session.prosCons?.sectionId ?? "none"}`],
    };
  }

  recommendAlternatives(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "recommend_alternatives");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "recommend_alternatives",
      validation: {
        decision: session.alternatives.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.alternatives.length ? [] : ["No alternatives evidenced"],
      },
      latestReport: this.store.getLatestReport(),
      alternatives: session.alternatives,
      notes: [`${session.alternatives.length} alternative(s)`],
    };
  }

  produceBuyingRecommendation(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_buying_recommendation");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "produce_buying_recommendation",
      validation: {
        decision: session.buyingRecommendation ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      buyingRecommendation: session.buyingRecommendation,
      notes: [`Buying recommendation ${session.buyingRecommendation?.recommendationId ?? "none"}`],
    };
  }

  explainIdealCustomerProfile(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "explain_ideal_customer_profile");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "explain_ideal_customer_profile",
      validation: {
        decision: session.idealCustomerProfile ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      idealCustomerProfile: session.idealCustomerProfile,
      notes: [`ICP ${session.idealCustomerProfile?.profileId ?? "none"}`],
    };
  }

  highlightLimitations(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "highlight_limitations");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "highlight_limitations",
      validation: {
        decision: session.limitations ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      limitations: session.limitations,
      notes: [`Limitations ${session.limitations?.sectionId ?? "none"}`],
    };
  }

  produceReviewContentReport(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_review_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (!session.subject || !session.reviewArticle || !session.prosCons || !session.buyingRecommendation) {
      return fail("produce_review_content_report", [
        "Unable to produce report — subject/review assets missing from evidence",
      ]);
    }

    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const comparison =
      resolveComparison(input) ?? this.integrations.resolveComparisonReport();

    const confidenceScore = computeConfidence({
      hasSubject: Boolean(session.subject),
      hasProsConsEvidence:
        session.prosCons.pros[0] !== "No pros evidenced" ||
        session.prosCons.cons[0] !== "No cons evidenced",
      hasAlternatives: session.alternatives.length > 0,
      hasBuying: Boolean(session.buyingRecommendation?.evidencePresent),
      hasIcp: Boolean(session.idealCustomerProfile),
      hasLimitations: Boolean(session.limitations),
      hasSourceLink: Boolean(
        session.sourceOpportunityReportId ||
          session.sourceComparisonReportId ||
          opportunity ||
          comparison,
      ),
    });

    const now = new Date().toISOString();
    const versionEntry = {
      version: session.reviewArticle.version,
      articleId: session.reviewArticle.articleId,
      reportId: null as string | null,
      timestamp: now,
      changeSummary: `Review v${session.reviewArticle.version} for ${session.productOrServiceReviewed}`,
    };

    const report: ReviewContentReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      productOrServiceReviewed: session.productOrServiceReviewed,
      reviewSummary: session.reviewArticle.summary,
      pros: [...session.prosCons.pros],
      cons: [...session.prosCons.cons],
      alternatives: session.alternatives.map((a) => ({ ...a, fabricated: false })),
      buyingRecommendation: { ...session.buyingRecommendation, conditions: [...session.buyingRecommendation.conditions] },
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceComparisonReportId
          ? [`comparison_site_report:${session.sourceComparisonReportId}`]
          : []),
        ...(input.fixtureProduct ? ["fixtureProduct"] : []),
        ...(input.fixtureAlternatives?.length ? ["fixtureAlternatives"] : []),
        "pros_cons",
        "buying_recommendation",
        "version_history",
      ],
      auditStatus: session.subject.evidencePresent ? "ready_for_q805" : "review_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: RCW_METADATA_VERSION,
      reportVersion: REVIEW_CONTENT_REPORT_VERSION,
      workerId: config.workerId || REVIEW_CONTENT_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      productId: session.productId,
      reviewArticle: {
        ...session.reviewArticle,
        keyFeatures: [...session.reviewArticle.keyFeatures],
        faqs: session.reviewArticle.faqs.map((f) => ({ ...f })),
        sections: session.reviewArticle.sections.map((s) => ({ ...s })),
        fabricated: false,
      },
      prosCons: {
        ...session.prosCons,
        pros: [...session.prosCons.pros],
        cons: [...session.prosCons.cons],
        fabricated: false,
        derivedFromEvidence: true,
      },
      idealCustomerProfile: {
        ...session.idealCustomerProfile!,
        traits: [...session.idealCustomerProfile!.traits],
        fabricated: false,
        derivedFromEvidence: true,
      },
      limitations: {
        ...session.limitations!,
        limitations: [...session.limitations!.limitations],
        tradeOffs: [...session.limitations!.tradeOffs],
        fabricated: false,
        derivedFromEvidence: true,
      },
      versionHistory: [],
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      sourceComparisonReportId: session.sourceComparisonReportId,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ805: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-04:affiliate_business:${session.affiliateBusinessId}`,
        `q8-04:affiliate_project:${session.affiliateProjectId}`,
        `q8-04:product:${session.productId}`,
        `q8-04:article:${session.reviewArticle.articleId}`,
        `q8-04:version:${session.reviewArticle.version}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceComparisonReportId
          ? [`q8-03:comparison:${session.sourceComparisonReportId}`]
          : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverFabricateReviewsRatingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRatings: true,
      neverReplaceComparisonSiteWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ805OrLater: true,
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
    appendRcwLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; product=${report.productOrServiceReviewed}`,
    });

    return {
      action: "produce_review_content_report",
      validation: report.validation,
      latestReport: report,
      reviewArticle: report.reviewArticle,
      prosCons: report.prosCons,
      alternatives: report.alternatives,
      buyingRecommendation: report.buyingRecommendation,
      idealCustomerProfile: report.idealCustomerProfile,
      limitations: report.limitations,
      versionHistory: report.versionHistory,
      notes: ["Review Content Report produced from opportunity/comparison/fixture evidence only"],
    };
  }

  produceReport(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    return this.produceReviewContentReport(input, config);
  }

  submitReport(input: RcwInput, config: ReviewContentWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceReviewContentReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: ReviewContentReport = {
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

  validate(input: RcwInput, config: ReviewContentWorkerConfiguration) {
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
        `reviews=${record.totalReviews}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): ReviewContentWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: REVIEW_CONTENT_WORKER_IDENTITY.workerId,
      workerName: REVIEW_CONTENT_WORKER_IDENTITY.workerName,
      capabilities: [...REVIEW_CONTENT_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalReviews: record.totalReviews,
    };
  }

  getQ805ConsumableContract(): Q805ConsumableContract {
    return {
      contractVersion: "RCW-Q805-v1",
      consumableByQ805: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "productOrServiceReviewed",
        "productId",
        "reviewSummary",
        "pros",
        "cons",
        "alternatives",
        "buyingRecommendation",
        "reviewArticle",
        "idealCustomerProfile",
        "limitations",
        "versionHistory",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
        "sourceOpportunityReportId",
        "sourceComparisonReportId",
      ] as const,
      types: {
        ReviewContentReport: "ReviewContentReport",
        ReviewArticle: "ReviewArticle",
        BuyingRecommendation: "BuyingRecommendation",
        ProsConsSection: "ProsConsSection",
      },
      notes: [
        "Q8-05 SEO Content Worker may consume review packages only.",
        "Reviews, verdicts, and product fields reflect fixture/opportunity/comparison evidence — never fabricated.",
        "RCW never publishes websites or replaces Comparison Site Worker.",
      ],
      neverFabricateReviewsRatingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRatings: true,
      neverReplaceComparisonSiteWorker: true,
    };
  }
}
