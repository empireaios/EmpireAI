import type { AffiliateComplianceWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type AffiliateComplianceWorkerDependencies,
} from "./integrations.js";
import { appendAcwLog } from "./acw-logging.js";
import {
  AFFILIATE_COMPLIANCE_REPORT_VERSION,
  AFFILIATE_COMPLIANCE_WORKER_IDENTITY,
  ACW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  buildComplianceRisks,
  buildComplianceScope,
  buildDisclaimerValidation,
  buildDisclosureValidation,
  buildPlatformRuleValidation,
  buildPolicyFindings,
  buildReadinessAssessment,
  buildRecommendedCorrections,
  computeConfidence,
  resolveAnalytics,
  resolveEvidence,
  resolveOpportunity,
  resolveReview,
  resolveSeo,
} from "./compliance-providers.js";
import { ComplianceStore, nextAssetId, nextReportId, nextSessionId } from "./compliance-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./compliance-validator.js";
import type {
  AcwInput,
  AcwRunReport,
  AffiliateComplianceReport,
  AffiliateComplianceWorkerCatalog,
  ComplianceSession,
  Q809ConsumableContract,
} from "./types.js";

function resolveIds(input: AcwInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const review = resolveReview(input) ?? integrations.resolveReviewReport();
  const seo = resolveSeo(input) ?? integrations.resolveSeoReport();
  const analytics = resolveAnalytics(input) ?? integrations.resolveAnalyticsReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    review?.affiliateProjectId?.trim() ||
    seo?.affiliateProjectId?.trim() ||
    analytics?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity, review, seo, analytics };
}

function fail(action: string, errors: string[]): AcwRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class ComplianceManager {
  private readonly store = new ComplianceStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: AffiliateComplianceWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: AffiliateComplianceWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendAcwLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: AffiliateComplianceWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Affiliate Compliance Worker connected"],
    };
  }

  private ensureSession(
    input: AcwInput,
    config: AffiliateComplianceWorkerConfiguration,
  ): ComplianceSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity, review, seo, analytics } =
      resolveIds(input, this.integrations);
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.affiliateProjectId === affiliateProjectId &&
      !(input.fixtureEvidence || input.complianceEvidence)
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: ComplianceSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      sourceReviewReportId: review?.reportId ?? null,
      sourceSeoReportId: seo?.reportId ?? null,
      sourceAnalyticsReportId: analytics?.reportId ?? null,
      evidence: null,
      complianceScope: null,
      disclosureValidation: null,
      platformRuleValidation: null,
      disclaimerValidation: null,
      policyFindings: [],
      complianceRisks: [],
      recommendedCorrections: [],
      readinessAssessment: null,
      outstandingIssues: [],
      frameworks: input.frameworks?.filter((f) => typeof f === "string" && f.trim()) ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: AcwInput, config: AffiliateComplianceWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: ComplianceSession, input: AcwInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    const analytics = resolveAnalytics(input) ?? this.integrations.resolveAnalyticsReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    if (review?.reportId) session.sourceReviewReportId = review.reportId;
    if (seo?.reportId) session.sourceSeoReportId = seo.reportId;
    if (analytics?.reportId) session.sourceAnalyticsReportId = analytics.reportId;

    if (!session.evidence || input.fixtureEvidence || input.complianceEvidence) {
      session.evidence = resolveEvidence(input);
    }
    const evidence = session.evidence ?? {};

    if (input.frameworks?.length) {
      session.frameworks = input.frameworks.filter((f) => typeof f === "string" && f.trim());
    }

    session.complianceScope = buildComplianceScope(
      session.affiliateProjectId,
      evidence,
      session.frameworks,
    );
    session.disclosureValidation = buildDisclosureValidation(evidence, review, seo);
    session.platformRuleValidation = buildPlatformRuleValidation(evidence);
    session.disclaimerValidation = buildDisclaimerValidation(evidence);
    session.policyFindings = buildPolicyFindings({
      disclosure: session.disclosureValidation,
      platform: session.platformRuleValidation,
      disclaimer: session.disclaimerValidation,
      evidence,
    });
    session.complianceRisks = buildComplianceRisks(session.policyFindings);
    session.recommendedCorrections = buildRecommendedCorrections(session.policyFindings);
    session.readinessAssessment = buildReadinessAssessment({
      disclosure: session.disclosureValidation,
      platform: session.platformRuleValidation,
      disclaimer: session.disclaimerValidation,
      findings: session.policyFindings,
      risks: session.complianceRisks,
    });

    session.outstandingIssues = [];
    if (!session.disclosureValidation.evidencePresent) {
      session.outstandingIssues.push("Disclosure evidence not provided");
    }
    if (!session.disclaimerValidation.evidencePresent) {
      session.outstandingIssues.push("Disclaimer evidence not provided");
    }
    if (!session.platformRuleValidation.evidencePresent) {
      session.outstandingIssues.push("Platform rule evidence not provided");
    }
    if (
      !session.sourceOpportunityReportId &&
      !session.sourceReviewReportId &&
      !session.sourceSeoReportId
    ) {
      session.outstandingIssues.push("No source opportunity/review/SEO report linked");
    }
    for (const blocker of session.readinessAssessment.blockers) {
      if (!session.outstandingIssues.includes(blocker)) {
        session.outstandingIssues.push(blocker);
      }
    }
  }

  consumeAffiliateOpportunityReport(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_affiliate_opportunity_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_affiliate_opportunity_report",
      validation: {
        decision: session.sourceOpportunityReportId ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.sourceOpportunityReportId
          ? []
          : ["Opportunity report not evidenced — not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      notes: [
        session.sourceOpportunityReportId
          ? `Consumed opportunity report ${session.sourceOpportunityReportId}`
          : "No opportunity report available",
      ],
    };
  }

  consumeReviewContentReport(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_review_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const review = resolveReview(input) ?? this.integrations.resolveReviewReport();
    if (review?.reportId) session.sourceReviewReportId = review.reportId;
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_review_content_report",
      validation: {
        decision: session.sourceReviewReportId ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.sourceReviewReportId
          ? []
          : ["Review content report not evidenced — not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      notes: [
        session.sourceReviewReportId
          ? `Consumed review report ${session.sourceReviewReportId}`
          : "No review report available",
      ],
    };
  }

  consumeSeoContentReport(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "consume_seo_content_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    if (seo?.reportId) session.sourceSeoReportId = seo.reportId;
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "consume_seo_content_report",
      validation: {
        decision: session.sourceSeoReportId ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.sourceSeoReportId
          ? []
          : ["SEO content report not evidenced — not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      notes: [
        session.sourceSeoReportId
          ? `Consumed SEO report ${session.sourceSeoReportId}`
          : "No SEO report available",
      ],
    };
  }

  validateAffiliateDisclosures(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "validate_affiliate_disclosures");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    const status = session.disclosureValidation?.status;
    return {
      action: "validate_affiliate_disclosures",
      validation: {
        decision:
          status === "pass" ? ("pass" as const) : status === "fail" ? ("fail" as const) : ("partial" as const),
        errors: status === "fail" ? ["Disclosure validation failed against evidence"] : [],
        warnings: session.disclosureValidation?.notes ?? [],
      },
      latestReport: this.store.getLatestReport(),
      disclosureValidation: session.disclosureValidation,
      notes: [`Disclosure validation ${session.disclosureValidation?.validationId ?? "none"}`],
    };
  }

  validatePlatformPolicyCompliance(
    input: AcwInput,
    config: AffiliateComplianceWorkerConfiguration,
  ) {
    const blocked = this.gate(input, config, "validate_platform_policy_compliance");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    const status = session.platformRuleValidation?.status;
    return {
      action: "validate_platform_policy_compliance",
      validation: {
        decision:
          status === "pass" ? ("pass" as const) : status === "fail" ? ("fail" as const) : ("partial" as const),
        errors: status === "fail" ? ["Platform policy validation failed against evidence"] : [],
        warnings: session.platformRuleValidation?.notes ?? [],
      },
      latestReport: this.store.getLatestReport(),
      platformRuleValidation: session.platformRuleValidation,
      notes: [`Platform validation ${session.platformRuleValidation?.validationId ?? "none"}`],
    };
  }

  validateRequiredDisclaimers(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "validate_required_disclaimers");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    const status = session.disclaimerValidation?.status;
    return {
      action: "validate_required_disclaimers",
      validation: {
        decision:
          status === "pass" ? ("pass" as const) : status === "fail" ? ("fail" as const) : ("partial" as const),
        errors: status === "fail" ? ["Disclaimer validation failed against evidence"] : [],
        warnings: session.disclaimerValidation?.notes ?? [],
      },
      latestReport: this.store.getLatestReport(),
      disclaimerValidation: session.disclaimerValidation,
      notes: [`Disclaimer validation ${session.disclaimerValidation?.validationId ?? "none"}`],
    };
  }

  detectComplianceViolations(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "detect_compliance_violations");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "detect_compliance_violations",
      validation: {
        decision: session.policyFindings.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      policyFindings: session.policyFindings,
      complianceRisks: session.complianceRisks,
      notes: [
        `${session.policyFindings.length} finding(s)`,
        `${session.complianceRisks.length} risk(s)`,
      ],
    };
  }

  recommendCorrectiveActions(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "recommend_corrective_actions");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "recommend_corrective_actions",
      validation: {
        decision: session.recommendedCorrections.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      recommendedCorrections: session.recommendedCorrections,
      notes: [`${session.recommendedCorrections.length} corrective recommendation(s)`],
    };
  }

  assessApprovalReadiness(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "assess_approval_readiness");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "assess_approval_readiness",
      validation: {
        decision: session.readinessAssessment?.evidencePresent
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: session.readinessAssessment?.blockers ?? [],
      },
      latestReport: this.store.getLatestReport(),
      readinessAssessment: session.readinessAssessment,
      notes: [
        `Readiness ${session.readinessAssessment?.status ?? "unknown"}`,
        "Assessment does not publish or auto-approve assets",
      ],
    };
  }

  produceAffiliateComplianceReport(
    input: AcwInput,
    config: AffiliateComplianceWorkerConfiguration,
  ) {
    const blocked = this.gate(input, config, "produce_affiliate_compliance_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (
      !session.complianceScope ||
      !session.disclosureValidation ||
      !session.platformRuleValidation ||
      !session.disclaimerValidation ||
      !session.readinessAssessment
    ) {
      return fail("produce_affiliate_compliance_report", [
        "Unable to produce report — compliance assessment assets missing from evidence",
      ]);
    }

    const confidenceScore = computeConfidence({
      disclosureEvidenced: session.disclosureValidation.evidencePresent,
      platformEvidenced: session.platformRuleValidation.evidencePresent,
      disclaimerEvidenced: session.disclaimerValidation.evidencePresent,
      hasOpportunity: Boolean(session.sourceOpportunityReportId),
      hasReview: Boolean(session.sourceReviewReportId),
      hasSeo: Boolean(session.sourceSeoReportId),
      findingCount: session.policyFindings.length,
    });

    const now = new Date().toISOString();
    const historyEntry = {
      entryId: nextAssetId("hist"),
      reportId: "",
      timestamp: now,
      readinessStatus: session.readinessAssessment.status,
      riskScore: session.readinessAssessment.riskScore,
      findingCount: session.policyFindings.length,
    };

    const report: AffiliateComplianceReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      complianceScope: { ...session.complianceScope, fabricated: false },
      disclosureValidation: {
        ...session.disclosureValidation,
        notes: [...session.disclosureValidation.notes],
        fabricated: false,
        legalConclusion: "not_legal_advice",
      },
      platformRuleValidation: {
        ...session.platformRuleValidation,
        notes: [...session.platformRuleValidation.notes],
        fabricated: false,
        legalConclusion: "not_legal_advice",
      },
      disclaimerValidation: {
        ...session.disclaimerValidation,
        notes: [...session.disclaimerValidation.notes],
        fabricated: false,
        legalConclusion: "not_legal_advice",
      },
      policyFindings: session.policyFindings.map((f) => ({
        ...f,
        fabricated: false,
        legalConclusion: "not_legal_advice" as const,
      })),
      complianceRisks: session.complianceRisks.map((r) => ({
        ...r,
        fabricated: false,
        legalConclusion: "not_legal_advice" as const,
      })),
      recommendedCorrections: session.recommendedCorrections.map((c) => ({
        ...c,
        fabricated: false,
        legalConclusion: "not_legal_advice" as const,
      })),
      readinessStatus: session.readinessAssessment.status,
      readinessAssessment: {
        ...session.readinessAssessment,
        blockers: [...session.readinessAssessment.blockers],
        notes: [...session.readinessAssessment.notes],
        fabricated: false,
        autoApproved: false,
        legalConclusion: "not_legal_advice",
      },
      auditStatus: confidenceScore >= 0.7 ? "ready_for_q809" : "assessment_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: ACW_METADATA_VERSION,
      reportVersion: AFFILIATE_COMPLIANCE_REPORT_VERSION,
      workerId: config.workerId || AFFILIATE_COMPLIANCE_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      history: [],
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceReviewReportId
          ? [`review_content_report:${session.sourceReviewReportId}`]
          : []),
        ...(session.sourceSeoReportId ? [`seo_content_report:${session.sourceSeoReportId}`] : []),
        ...(session.sourceAnalyticsReportId
          ? [`analytics_report:${session.sourceAnalyticsReportId}`]
          : []),
        ...(input.fixtureEvidence || input.complianceEvidence ? ["complianceEvidence"] : []),
        "disclosure_validation",
        "platform_rule_validation",
        "disclaimer_validation",
        "policy_findings",
        "compliance_history",
      ],
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      sourceReviewReportId: session.sourceReviewReportId,
      sourceSeoReportId: session.sourceSeoReportId,
      sourceAnalyticsReportId: session.sourceAnalyticsReportId,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ809: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-08:affiliate_business:${session.affiliateBusinessId}`,
        `q8-08:affiliate_project:${session.affiliateProjectId}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceReviewReportId ? [`q8-04:review:${session.sourceReviewReportId}`] : []),
        ...(session.sourceSeoReportId ? [`q8-05:seo:${session.sourceSeoReportId}`] : []),
        ...(session.sourceAnalyticsReportId
          ? [`q8-07:analytics:${session.sourceAnalyticsReportId}`]
          : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveComplianceAuditHistory: true,
      neverFabricateComplianceResults: true,
      neverProvideUnverifiedLegalConclusions: true,
      neverPublishAffiliateContent: true,
      neverReplaceLegalProfessionals: true,
      neverOverrideProgrammeRequirements: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ809OrLater: true,
      legalConclusion: "not_legal_advice",
    };

    historyEntry.reportId = report.reportId;
    const priorHistory = this.store.getHistory();
    report.history = [...priorHistory, historyEntry];
    this.store.appendHistory(historyEntry);

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
    appendAcwLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; confidence=${report.confidenceScore}`,
    });

    return {
      action: "produce_affiliate_compliance_report",
      validation: report.validation,
      latestReport: report,
      complianceScope: report.complianceScope,
      disclosureValidation: report.disclosureValidation,
      platformRuleValidation: report.platformRuleValidation,
      disclaimerValidation: report.disclaimerValidation,
      policyFindings: report.policyFindings,
      complianceRisks: report.complianceRisks,
      recommendedCorrections: report.recommendedCorrections,
      readinessAssessment: report.readinessAssessment,
      history: report.history,
      notes: [
        "Affiliate Compliance Report produced from evidenced checks only",
        "Not legal advice; does not publish or auto-approve assets",
      ],
    };
  }

  produceReport(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    return this.produceAffiliateComplianceReport(input, config);
  }

  submitReport(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceAffiliateComplianceReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: AffiliateComplianceReport = {
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
      history: this.store.getHistory(),
    };
  }

  validate(input: AcwInput, config: AffiliateComplianceWorkerConfiguration) {
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
        `history=${record.totalHistoryEntries}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): AffiliateComplianceWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.workerId,
      workerName: AFFILIATE_COMPLIANCE_WORKER_IDENTITY.workerName,
      capabilities: [...AFFILIATE_COMPLIANCE_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalHistoryEntries: record.totalHistoryEntries,
    };
  }

  getQ809ConsumableContract(): Q809ConsumableContract {
    return {
      contractVersion: "ACW-Q809-v1",
      consumableByQ809: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "complianceScope",
        "disclosureValidation",
        "platformRuleValidation",
        "disclaimerValidation",
        "policyFindings",
        "complianceRisks",
        "recommendedCorrections",
        "readinessStatus",
        "readinessAssessment",
        "history",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        AffiliateComplianceReport: "AffiliateComplianceReport",
        DisclosureValidation: "DisclosureValidation",
        PlatformRuleValidation: "PlatformRuleValidation",
        RecommendedCorrection: "RecommendedCorrection",
        ReadinessAssessment: "ReadinessAssessment",
      },
      notes: [
        "Q8-09 Affiliate Certification may consume compliance packages only.",
        "Findings reflect evidenced checks — never fabricated legal conclusions.",
        "ACW never publishes content, replaces legal professionals, or auto-approves assets.",
      ],
      neverFabricateComplianceResults: true,
      neverProvideUnverifiedLegalConclusions: true,
      neverPublishAffiliateContent: true,
      neverReplaceLegalProfessionals: true,
    };
  }
}
