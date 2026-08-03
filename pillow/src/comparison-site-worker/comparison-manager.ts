import type { ComparisonSiteWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type ComparisonSiteWorkerDependencies } from "./integrations.js";
import { appendCswLog } from "./csw-logging.js";
import {
  COMPARISON_SITE_REPORT_VERSION,
  COMPARISON_SITE_WORKER_IDENTITY,
  CSW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  buildBuyerGuide,
  buildComparisonPage,
  buildFeatureTable,
  buildMethodology,
  buildPricingTable,
  buildRankingPage,
  buildRankings,
  collectProducts,
  computeConfidence,
  resolveOpportunity,
} from "./comparison-providers.js";
import { ComparisonStore, nextReportId, nextSessionId } from "./comparison-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./comparison-validator.js";
import type {
  ComparisonSession,
  ComparisonSiteReport,
  ComparisonSiteWorkerCatalog,
  CswInput,
  CswRunReport,
  Q804ConsumableContract,
} from "./types.js";

function resolveIds(input: CswInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity };
}

function fail(action: string, errors: string[]): CswRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class ComparisonManager {
  private readonly store = new ComparisonStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: ComparisonSiteWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: ComparisonSiteWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendCswLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: ComparisonSiteWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Comparison Site Worker connected"],
    };
  }

  private ensureSession(
    input: CswInput,
    config: ComparisonSiteWorkerConfiguration,
  ): ComparisonSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity } = resolveIds(
      input,
      this.integrations,
    );
    const topic =
      input.comparisonTopic?.trim() ||
      opportunity?.productCategory ||
      opportunity?.targetNiche ||
      input.productCategory?.trim() ||
      input.niche?.trim() ||
      "affiliate_comparison";
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.comparisonTopic === topic &&
      !(input.fixtureProducts && input.fixtureProducts.length)
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: ComparisonSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      comparisonTopic: topic,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      products: [],
      comparisonPage: null,
      rankingPage: null,
      buyerGuide: null,
      comparisonTables: [],
      rankingResults: [],
      methodologySummary: null,
      outstandingIssues: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: CswInput, config: ComparisonSiteWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: ComparisonSession, input: CswInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    const merged: CswInput = {
      ...input,
      opportunityReport: input.opportunityReport ?? opportunity,
      fixtureOpportunity: input.fixtureOpportunity ?? opportunity,
    };
    if (!session.products.length || (input.fixtureProducts?.length ?? 0) > 0) {
      session.products = collectProducts(merged);
    }
    if (!session.comparisonTables.length) {
      session.comparisonTables = [
        buildFeatureTable(session.products),
        buildPricingTable(session.products),
      ];
    }
    if (!session.methodologySummary) {
      const hasScores = session.products.some(
        (p) =>
          p.price != null ||
          p.features.length > 0 ||
          Object.keys(p.specs).length > 0 ||
          Boolean(
            p.programmeId &&
              opportunity?.opportunityRanking?.some((r) => r.programmeId === p.programmeId),
          ),
      );
      session.methodologySummary = buildMethodology(hasScores);
    }
    if (!session.rankingResults.length) {
      session.rankingResults = buildRankings(
        session.products,
        opportunity,
        input.topN ?? 5,
      );
    }
    if (!session.comparisonPage) {
      session.comparisonPage = buildComparisonPage(
        session.comparisonTopic,
        session.products,
        session.comparisonTables,
      );
    }
    if (!session.rankingPage && session.methodologySummary) {
      session.rankingPage = buildRankingPage(
        session.comparisonTopic,
        session.rankingResults,
        session.methodologySummary,
      );
    }
    if (!session.buyerGuide) {
      session.buyerGuide = buildBuyerGuide(
        session.comparisonTopic,
        session.products,
        session.rankingResults,
      );
    }
    session.outstandingIssues = [];
    if (!session.products.length) {
      session.outstandingIssues.push("No products compared — empty evidence");
    }
    if (session.rankingResults.every((r) => r.score == null)) {
      session.outstandingIssues.push("No observed ranking scores — structural order only");
    }
    if (!session.sourceOpportunityReportId) {
      session.outstandingIssues.push("No source opportunity report id linked");
    }
  }

  consumeAffiliateOpportunityReport(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
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
          : ["No opportunity report available — comparison may use fixture products only"],
      },
      latestReport: this.store.getLatestReport(),
      notes: opportunity
        ? [`Consumed opportunity report ${opportunity.reportId ?? "fixture"}`]
        : ["No opportunity report bound"],
    };
  }

  generateComparisonPage(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_comparison_page");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_comparison_page",
      validation: {
        decision: session.comparisonPage ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      comparisonPage: session.comparisonPage,
      notes: [`Comparison page ${session.comparisonPage?.pageId ?? "none"}`],
    };
  }

  generateRankingPage(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_ranking_page");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_ranking_page",
      validation: {
        decision: session.rankingPage ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      rankingPage: session.rankingPage,
      rankingResults: session.rankingResults,
      notes: [`Ranking page ${session.rankingPage?.pageId ?? "none"}`],
    };
  }

  generateBuyerGuide(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_buyer_guide");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_buyer_guide",
      validation: {
        decision: session.buyerGuide ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      buyerGuide: session.buyerGuide,
      notes: [`Buyer guide ${session.buyerGuide?.guideId ?? "none"}`],
    };
  }

  generateComparisonTables(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "generate_comparison_tables");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "generate_comparison_tables",
      validation: {
        decision: session.comparisonTables.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      comparisonTables: session.comparisonTables,
      notes: [`${session.comparisonTables.length} comparison table(s)`],
    };
  }

  documentMethodology(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "document_methodology");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "document_methodology",
      validation: {
        decision: session.methodologySummary ? ("pass" as const) : ("fail" as const),
        errors: session.methodologySummary ? [] : ["Methodology missing"],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      methodologySummary: session.methodologySummary,
      notes: [`Methodology ${session.methodologySummary?.methodologyId ?? "none"}`],
    };
  }

  produceComparisonSiteReport(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_comparison_site_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);

    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const confidenceScore = computeConfidence({
      products: session.products.length,
      hasTables: session.comparisonTables.length > 0,
      hasRankings: session.rankingResults.length > 0,
      hasScoredRanking: session.rankingResults.some((r) => r.score != null),
      hasBuyerGuide: Boolean(session.buyerGuide),
      hasMethodology: Boolean(session.methodologySummary),
      hasOpportunityLink: Boolean(session.sourceOpportunityReportId || opportunity),
    });

    const now = new Date().toISOString();
    const report: ComparisonSiteReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      comparisonTopic: session.comparisonTopic,
      productsCompared: session.products.map((p) => ({
        ...p,
        features: [...p.features],
        pros: [...p.pros],
        cons: [...p.cons],
        specs: { ...p.specs },
        fabricated: false,
      })),
      rankingResults: session.rankingResults.map((r) => ({
        ...r,
        rationale: [...r.rationale],
        fabricated: false,
      })),
      comparisonTables: session.comparisonTables.map((t) => ({
        ...t,
        columns: [...t.columns],
        rows: t.rows.map((row) => ({ ...row })),
        fabricated: false,
        derivedFromEvidence: true,
      })),
      buyerGuide: session.buyerGuide!,
      methodologySummary: session.methodologySummary!,
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(input.fixtureProducts?.length ? ["fixtureProducts"] : []),
        ...(opportunity ? ["affiliate_opportunity_worker"] : []),
        "feature_table",
        "pricing_table",
        "methodology",
      ],
      auditStatus:
        session.products.length && session.methodologySummary
          ? "ready_for_q804"
          : "assets_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: CSW_METADATA_VERSION,
      reportVersion: COMPARISON_SITE_REPORT_VERSION,
      workerId: config.workerId || COMPARISON_SITE_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      comparisonPage: session.comparisonPage!,
      rankingPage: session.rankingPage!,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ804: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-03:affiliate_business:${session.affiliateBusinessId}`,
        `q8-03:affiliate_project:${session.affiliateProjectId}`,
        `q8-03:topic:${session.comparisonTopic}`,
        `q8-03:products:${session.products.length}`,
        `q8-03:rankings:${session.rankingResults.length}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverFabricateRankingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRankingsWithoutEvidence: true,
      neverReplaceReviewContentWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ804OrLater: true,
    };

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
    appendCswLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; topic=${report.comparisonTopic}`,
    });

    return {
      action: "produce_comparison_site_report",
      validation: report.validation,
      latestReport: report,
      comparisonPage: report.comparisonPage,
      rankingPage: report.rankingPage,
      buyerGuide: report.buyerGuide,
      comparisonTables: report.comparisonTables,
      rankingResults: report.rankingResults,
      methodologySummary: report.methodologySummary,
      notes: ["Comparison Site Report produced from opportunity/fixture evidence only"],
    };
  }

  produceReport(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    return this.produceComparisonSiteReport(input, config);
  }

  submitReport(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceComparisonSiteReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: ComparisonSiteReport = {
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

  validate(input: CswInput, config: ComparisonSiteWorkerConfiguration) {
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
        `pages=${record.totalPages}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): ComparisonSiteWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: COMPARISON_SITE_WORKER_IDENTITY.workerId,
      workerName: COMPARISON_SITE_WORKER_IDENTITY.workerName,
      capabilities: [...COMPARISON_SITE_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalPages: record.totalPages,
    };
  }

  getQ804ConsumableContract(): Q804ConsumableContract {
    return {
      contractVersion: "CSW-Q804-v1",
      consumableByQ804: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "comparisonTopic",
        "productsCompared",
        "rankingResults",
        "comparisonTables",
        "buyerGuide",
        "methodologySummary",
        "comparisonPage",
        "rankingPage",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
        "sourceOpportunityReportId",
      ] as const,
      types: {
        ComparisonSiteReport: "ComparisonSiteReport",
        ComparisonPage: "ComparisonPage",
        RankingPage: "RankingPage",
        BuyerGuide: "BuyerGuide",
        ComparisonTable: "ComparisonTable",
      },
      notes: [
        "Q8-04 Review Content Worker may consume comparison packages only.",
        "Rankings and product fields reflect fixture/opportunity evidence — never fabricated.",
        "CSW never publishes websites or replaces Review Content Worker.",
      ],
      neverFabricateRankingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRankingsWithoutEvidence: true,
      neverReplaceReviewContentWorker: true,
    };
  }
}
