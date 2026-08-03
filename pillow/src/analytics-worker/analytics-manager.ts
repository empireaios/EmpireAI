import type { AnalyticsWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type AnalyticsWorkerDependencies } from "./integrations.js";
import { appendAnwLog } from "./anw-logging.js";
import {
  ANALYTICS_REPORT_VERSION,
  ANALYTICS_WORKER_IDENTITY,
  ANW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  buildClickMetrics,
  buildCommissionSummary,
  buildConversionMetrics,
  buildFunnelPerformance,
  buildKpiDashboard,
  buildOptimisationOpportunities,
  buildRevenueSummary,
  buildSeoPerformance,
  buildTrendAnalysis,
  computeConfidence,
  resolveFunnel,
  resolveOpportunity,
  resolveSeo,
  resolveSnapshot,
} from "./analytics-providers.js";
import { AnalyticsStore, nextAssetId, nextReportId, nextSessionId } from "./analytics-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./analytics-validator.js";
import type {
  AnalyticsReport,
  AnalyticsSession,
  AnalyticsWorkerCatalog,
  AnwInput,
  AnwRunReport,
  Q808ConsumableContract,
} from "./types.js";

function resolveIds(input: AnwInput, integrations: IntegrationCoordinator) {
  const opportunity = resolveOpportunity(input) ?? integrations.resolveOpportunityReport();
  const seo = resolveSeo(input) ?? integrations.resolveSeoReport();
  const funnel = resolveFunnel(input) ?? integrations.resolveFunnelReport();
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    opportunity?.affiliateBusinessId?.trim() ??
    input.affiliateProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    opportunity?.affiliateProjectId?.trim() ||
    seo?.affiliateProjectId?.trim() ||
    funnel?.affiliateProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId, opportunity, seo, funnel };
}

function fail(action: string, errors: string[]): AnwRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class AnalyticsManager {
  private readonly store = new AnalyticsStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: AnalyticsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: AnalyticsWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendAnwLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: AnalyticsWorkerConfiguration) {
    this.integrations.connect(
      config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS,
    );
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Analytics Worker connected"],
    };
  }

  private ensureSession(input: AnwInput, config: AnalyticsWorkerConfiguration): AnalyticsSession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId, opportunity, seo, funnel } = resolveIds(
      input,
      this.integrations,
    );
    const periodLabel = input.periodLabel?.trim() || "current_period";
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      existing.periodLabel === periodLabel &&
      !(input.fixtureMetrics || input.metricSnapshot)
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: AnalyticsSession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      periodLabel,
      sourceOpportunityReportId: opportunity?.reportId ?? null,
      sourceSeoReportId: seo?.reportId ?? null,
      sourceFunnelReportId: funnel?.reportId ?? null,
      snapshot: null,
      clickMetrics: null,
      conversionMetrics: null,
      commissionSummary: null,
      revenueSummary: null,
      seoPerformance: null,
      funnelPerformance: null,
      trendAnalysis: null,
      optimisationOpportunities: [],
      kpiDashboard: null,
      outstandingIssues: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: AnwInput, config: AnalyticsWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  private hydrateSession(session: AnalyticsSession, input: AnwInput) {
    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    const funnel = resolveFunnel(input) ?? this.integrations.resolveFunnelReport();
    if (opportunity?.reportId) session.sourceOpportunityReportId = opportunity.reportId;
    if (seo?.reportId) session.sourceSeoReportId = seo.reportId;
    if (funnel?.reportId) session.sourceFunnelReportId = funnel.reportId;

    if (!session.snapshot || input.fixtureMetrics || input.metricSnapshot) {
      session.snapshot = resolveSnapshot(input);
    }
    const snapshot = session.snapshot ?? {};

    if (!session.clickMetrics) session.clickMetrics = buildClickMetrics(snapshot);
    if (!session.conversionMetrics) {
      session.conversionMetrics = buildConversionMetrics(snapshot);
    }
    if (!session.commissionSummary) {
      session.commissionSummary = buildCommissionSummary(snapshot);
    }
    if (!session.revenueSummary) session.revenueSummary = buildRevenueSummary(snapshot);
    if (!session.seoPerformance) {
      session.seoPerformance = buildSeoPerformance(snapshot, seo);
    }
    if (!session.funnelPerformance) {
      session.funnelPerformance = buildFunnelPerformance(snapshot, funnel);
    }
    if (!session.trendAnalysis) session.trendAnalysis = buildTrendAnalysis(snapshot);
    session.optimisationOpportunities = buildOptimisationOpportunities({
      clicks: session.clickMetrics,
      conversions: session.conversionMetrics,
      commissions: session.commissionSummary,
      seo: session.seoPerformance,
      funnel: session.funnelPerformance,
      trends: session.trendAnalysis,
    });
    session.kpiDashboard = buildKpiDashboard(session.periodLabel, {
      clicks: session.clickMetrics,
      conversions: session.conversionMetrics,
      commissions: session.commissionSummary,
      revenue: session.revenueSummary,
      seo: session.seoPerformance,
      funnel: session.funnelPerformance,
    });

    session.outstandingIssues = [];
    if (!session.clickMetrics.evidencePresent) {
      session.outstandingIssues.push("Click metrics not evidenced");
    }
    if (!session.conversionMetrics.evidencePresent) {
      session.outstandingIssues.push("Conversion metrics not evidenced");
    }
    if (!session.commissionSummary.evidencePresent) {
      session.outstandingIssues.push("Commission metrics not evidenced");
    }
    if (
      !session.sourceOpportunityReportId &&
      !session.sourceSeoReportId &&
      !session.sourceFunnelReportId
    ) {
      session.outstandingIssues.push("No source opportunity/SEO/funnel report linked");
    }
  }

  collectPerformanceMetrics(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "collect_performance_metrics");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "collect_performance_metrics",
      validation: {
        decision: session.snapshot ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.outstandingIssues,
      },
      latestReport: this.store.getLatestReport(),
      clickMetrics: session.clickMetrics,
      conversionMetrics: session.conversionMetrics,
      commissionSummary: session.commissionSummary,
      notes: ["Performance metrics collected from evidenced snapshot only"],
    };
  }

  trackClicks(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "track_clicks");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "track_clicks",
      validation: {
        decision: session.clickMetrics?.evidencePresent ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: session.clickMetrics?.evidencePresent
          ? []
          : ["Click metrics unknown — not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      clickMetrics: session.clickMetrics,
      notes: [`Click metrics ${session.clickMetrics?.metricsId ?? "none"}`],
    };
  }

  trackConversions(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "track_conversions");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "track_conversions",
      validation: {
        decision: session.conversionMetrics?.evidencePresent
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: session.conversionMetrics?.evidencePresent
          ? []
          : ["Conversion metrics unknown — not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      conversionMetrics: session.conversionMetrics,
      notes: [`Conversion metrics ${session.conversionMetrics?.metricsId ?? "none"}`],
    };
  }

  trackCommissions(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "track_commissions");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "track_commissions",
      validation: {
        decision: session.commissionSummary?.evidencePresent
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      commissionSummary: session.commissionSummary,
      revenueSummary: session.revenueSummary,
      notes: [`Commission summary ${session.commissionSummary?.summaryId ?? "none"}`],
    };
  }

  measureSeoPerformance(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "measure_seo_performance");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "measure_seo_performance",
      validation: {
        decision: session.seoPerformance?.evidencePresent
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      seoPerformance: session.seoPerformance,
      notes: [`SEO performance ${session.seoPerformance?.summaryId ?? "none"}`],
    };
  }

  analyseFunnelPerformance(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "analyse_funnel_performance");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "analyse_funnel_performance",
      validation: {
        decision: session.funnelPerformance?.evidencePresent
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      funnelPerformance: session.funnelPerformance,
      notes: [`Funnel performance ${session.funnelPerformance?.summaryId ?? "none"}`],
    };
  }

  detectTrends(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "detect_trends");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "detect_trends",
      validation: {
        decision: session.trendAnalysis ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      trendAnalysis: session.trendAnalysis,
      notes: [`Trend analysis ${session.trendAnalysis?.analysisId ?? "none"}`],
    };
  }

  recommendOptimisations(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "recommend_optimisations");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "recommend_optimisations",
      validation: {
        decision: session.optimisationOpportunities.length
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      optimisationOpportunities: session.optimisationOpportunities,
      notes: [`${session.optimisationOpportunities.length} optimisation opportunity(ies)`],
    };
  }

  produceAnalyticsReport(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "produce_analytics_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (
      !session.clickMetrics ||
      !session.conversionMetrics ||
      !session.commissionSummary ||
      !session.revenueSummary ||
      !session.seoPerformance ||
      !session.funnelPerformance ||
      !session.trendAnalysis ||
      !session.kpiDashboard
    ) {
      return fail("produce_analytics_report", [
        "Unable to produce report — analytics assets missing from evidence",
      ]);
    }

    const opportunity =
      resolveOpportunity(input) ?? this.integrations.resolveOpportunityReport();
    const seo = resolveSeo(input) ?? this.integrations.resolveSeoReport();
    const funnel = resolveFunnel(input) ?? this.integrations.resolveFunnelReport();

    const confidenceScore = computeConfidence({
      hasClicks: session.clickMetrics.evidencePresent,
      hasConversions: session.conversionMetrics.evidencePresent,
      hasCommissions: session.commissionSummary.evidencePresent,
      hasSeo: session.seoPerformance.evidencePresent,
      hasFunnel: session.funnelPerformance.evidencePresent,
      hasTrends: session.trendAnalysis.trends.some((t) => t.evidencePresent),
      hasSourceLink: Boolean(
        session.sourceOpportunityReportId ||
          session.sourceSeoReportId ||
          session.sourceFunnelReportId ||
          opportunity ||
          seo ||
          funnel,
      ),
    });

    const now = new Date().toISOString();
    const historyEntry = {
      entryId: nextAssetId("hist"),
      reportId: "",
      timestamp: now,
      clicks: session.clickMetrics.clicks,
      conversions: session.conversionMetrics.conversions,
      commissionAmount: session.commissionSummary.commissionAmount,
      revenueAmount: session.revenueSummary.revenueAmount,
    };

    const report: AnalyticsReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      clickMetrics: { ...session.clickMetrics, fabricated: false },
      conversionMetrics: { ...session.conversionMetrics, fabricated: false },
      commissionSummary: { ...session.commissionSummary, fabricated: false },
      revenueSummary: { ...session.revenueSummary, fabricated: false },
      seoPerformance: {
        ...session.seoPerformance,
        notes: [...session.seoPerformance.notes],
        fabricated: false,
      },
      funnelPerformance: {
        ...session.funnelPerformance,
        notes: [...session.funnelPerformance.notes],
        fabricated: false,
      },
      optimisationOpportunities: session.optimisationOpportunities.map((o) => ({
        ...o,
        fabricated: false,
      })),
      trendAnalysis: {
        ...session.trendAnalysis,
        trends: session.trendAnalysis.trends.map((t) => ({ ...t })),
        anomalies: session.trendAnalysis.anomalies.map((a) => ({ ...a })),
        fabricated: false,
      },
      auditStatus: confidenceScore >= 0.7 ? "ready_for_q808" : "analysis_ready",
      outstandingIssues: [...session.outstandingIssues],
      confidenceScore,
      metadataVersion: ANW_METADATA_VERSION,
      reportVersion: ANALYTICS_REPORT_VERSION,
      workerId: config.workerId || ANALYTICS_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      kpiDashboard: {
        ...session.kpiDashboard,
        kpis: session.kpiDashboard.kpis.map((k) => ({ ...k })),
        notes: [...session.kpiDashboard.notes],
      },
      history: [],
      supportingEvidence: [
        ...(session.sourceOpportunityReportId
          ? [`opportunity_report:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceSeoReportId ? [`seo_content_report:${session.sourceSeoReportId}`] : []),
        ...(session.sourceFunnelReportId
          ? [`email_funnel_report:${session.sourceFunnelReportId}`]
          : []),
        ...(input.fixtureMetrics || input.metricSnapshot ? ["metricSnapshot"] : []),
        "click_metrics",
        "conversion_metrics",
        "commission_summary",
        "seo_performance",
        "funnel_performance",
        "trend_analysis",
        "analytics_history",
      ],
      sourceOpportunityReportId: session.sourceOpportunityReportId,
      sourceSeoReportId: session.sourceSeoReportId,
      sourceFunnelReportId: session.sourceFunnelReportId,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ808: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-07:affiliate_business:${session.affiliateBusinessId}`,
        `q8-07:affiliate_project:${session.affiliateProjectId}`,
        `q8-07:period:${session.periodLabel}`,
        ...(session.sourceOpportunityReportId
          ? [`q8-02:opportunity:${session.sourceOpportunityReportId}`]
          : []),
        ...(session.sourceSeoReportId ? [`q8-05:seo:${session.sourceSeoReportId}`] : []),
        ...(session.sourceFunnelReportId ? [`q8-06:funnel:${session.sourceFunnelReportId}`] : []),
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveAnalyticsHistory: true,
      neverFabricateAnalyticsOrPerformanceResults: true,
      neverModifyCampaignsAutomatically: true,
      neverManipulateAnalytics: true,
      neverReplaceAffiliateComplianceWorker: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ808OrLater: true,
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
    appendAnwLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; confidence=${report.confidenceScore}`,
    });

    return {
      action: "produce_analytics_report",
      validation: report.validation,
      latestReport: report,
      clickMetrics: report.clickMetrics,
      conversionMetrics: report.conversionMetrics,
      commissionSummary: report.commissionSummary,
      revenueSummary: report.revenueSummary,
      seoPerformance: report.seoPerformance,
      funnelPerformance: report.funnelPerformance,
      optimisationOpportunities: report.optimisationOpportunities,
      trendAnalysis: report.trendAnalysis,
      kpiDashboard: report.kpiDashboard,
      history: report.history,
      notes: ["Analytics Report produced from evidenced metrics only"],
    };
  }

  produceReport(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    return this.produceAnalyticsReport(input, config);
  }

  submitReport(input: AnwInput, config: AnalyticsWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceAnalyticsReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: AnalyticsReport = {
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

  validate(input: AnwInput, config: AnalyticsWorkerConfiguration) {
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

  getCatalog(): AnalyticsWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: ANALYTICS_WORKER_IDENTITY.workerId,
      workerName: ANALYTICS_WORKER_IDENTITY.workerName,
      capabilities: [...ANALYTICS_WORKER_IDENTITY.skillProfile],
      totalReports: record.totalReports,
      totalHistoryEntries: record.totalHistoryEntries,
    };
  }

  getQ808ConsumableContract(): Q808ConsumableContract {
    return {
      contractVersion: "ANW-Q808-v1",
      consumableByQ808: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "clickMetrics",
        "conversionMetrics",
        "commissionSummary",
        "revenueSummary",
        "seoPerformance",
        "funnelPerformance",
        "optimisationOpportunities",
        "trendAnalysis",
        "kpiDashboard",
        "history",
        "supportingEvidence",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        AnalyticsReport: "AnalyticsReport",
        ClickMetrics: "ClickMetrics",
        ConversionMetrics: "ConversionMetrics",
        OptimisationOpportunity: "OptimisationOpportunity",
        KpiDashboard: "KpiDashboard",
      },
      notes: [
        "Q8-08 Affiliate Compliance Worker may consume analytics packages only.",
        "Metrics reflect evidenced fixtures/snapshots — never fabricated.",
        "ANW never modifies campaigns, manipulates analytics, or replaces Compliance Worker.",
      ],
      neverFabricateAnalyticsOrPerformanceResults: true,
      neverModifyCampaignsAutomatically: true,
      neverManipulateAnalytics: true,
      neverReplaceAffiliateComplianceWorker: true,
    };
  }
}
