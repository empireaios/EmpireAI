import type { AffiliateOpportunityWorkerConfiguration } from "./configuration.js";
import { IntegrationCoordinator, type AffiliateOpportunityWorkerDependencies } from "./integrations.js";
import { appendAowLog } from "./aow-logging.js";
import {
  AFFILIATE_OPPORTUNITY_REPORT_VERSION,
  AOW_METADATA_VERSION,
  AFFILIATE_OPPORTUNITY_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import {
  analyseCommissions,
  assessCompetition,
  computeConfidence,
  discoverProducts,
  discoverProgrammes,
  estimateDemand,
  identifyRisks,
  rankOpportunities,
  recommendFromRanking,
  researchNiches,
} from "./opportunity-providers.js";
import { nextReportId, nextSessionId, OpportunityStore } from "./opportunity-store.js";
import {
  assertWorkerEnabled,
  validateBoundaryInput,
  validateReportShape,
} from "./opportunity-validator.js";
import type {
  AffiliateOpportunityReport,
  AffiliateOpportunityWorkerCatalog,
  AowInput,
  AowRunReport,
  OpportunitySession,
  Q803ConsumableContract,
} from "./types.js";

function resolveIds(input: AowInput, integrations: IntegrationCoordinator) {
  const affiliateBusinessId =
    integrations.resolveAffiliateBusinessId(input.affiliateBusinessId) ??
    input.affiliateProjectId?.trim() ??
    input.factoryProjectId?.trim() ??
    "afc-biz-unknown";
  const affiliateProjectId =
    input.affiliateProjectId?.trim() ||
    input.factoryProjectId?.trim() ||
    affiliateBusinessId;
  return { affiliateBusinessId, affiliateProjectId };
}

function fail(action: string, errors: string[]): AowRunReport {
  return {
    action,
    validation: { decision: "fail", errors, warnings: [] },
    latestReport: null,
    notes: errors,
  };
}

export class OpportunityManager {
  private readonly store = new OpportunityStore();
  private readonly integrations = new IntegrationCoordinator();

  bindIntegrations(deps: AffiliateOpportunityWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getStore() {
    return this.store;
  }

  initialize(config: AffiliateOpportunityWorkerConfiguration) {
    this.store.seed(config.seedReports);
    appendAowLog({ event: "initialize", details: `workerId=${config.workerId}` });
  }

  connect(config: AffiliateOpportunityWorkerConfiguration) {
    this.integrations.connect(config.integrationTargets.length ? config.integrationTargets : INTEGRATION_TARGETS);
    return {
      action: "connect",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      notes: ["Affiliate Opportunity Worker connected"],
    };
  }

  private ensureSession(
    input: AowInput,
    config: AffiliateOpportunityWorkerConfiguration,
  ): OpportunitySession {
    const existing = this.store.getLatestSession();
    const { affiliateBusinessId, affiliateProjectId } = resolveIds(input, this.integrations);
    if (
      existing &&
      existing.affiliateBusinessId === affiliateBusinessId &&
      (!input.fixtureProgrammes || input.fixtureProgrammes.length === 0)
    ) {
      return existing;
    }
    const now = new Date().toISOString();
    const session: OpportunitySession = {
      sessionId: nextSessionId(),
      affiliateBusinessId,
      affiliateProjectId,
      evidenceMode: input.evidenceMode ?? "fixture",
      programmes: [],
      products: [],
      niches: [],
      commissionComparisons: [],
      demandAssessment: null,
      competitionAssessment: null,
      opportunityRanking: [],
      risks: [],
      recommendation: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.saveSession(session);
    void config;
    return session;
  }

  private gate(input: AowInput, config: AffiliateOpportunityWorkerConfiguration, action: string) {
    assertWorkerEnabled(config);
    const boundary = validateBoundaryInput(input);
    if (!boundary.valid) return fail(action, boundary.errors);
    return null;
  }

  discoverAffiliateProgrammes(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "discover_affiliate_programmes");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const programmes = discoverProgrammes(input);
    session.programmes = programmes;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "discover_affiliate_programmes",
      validation: {
        decision: programmes.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: programmes.length ? [] : ["No programmes in fixtures — empty result, not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      programmes,
      notes: [`Discovered ${programmes.length} programme(s) from fixture evidence`],
    };
  }

  discoverAffiliateProducts(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "discover_affiliate_products");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    if (!session.programmes.length) session.programmes = discoverProgrammes(input);
    const products = discoverProducts(input);
    session.products = products;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "discover_affiliate_products",
      validation: {
        decision: products.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: products.length ? [] : ["No products in fixtures — empty result, not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      products,
      notes: [`Identified ${products.length} product(s) from fixture evidence`],
    };
  }

  researchProfitableNiches(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "research_profitable_niches");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    const niches = researchNiches(input);
    session.niches = niches;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "research_profitable_niches",
      validation: {
        decision: niches.length ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: niches.length ? [] : ["No niches in fixtures — empty result, not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      niches,
      notes: [`Researched ${niches.length} niche(s) from fixture evidence`],
    };
  }

  analyseCommissionStructures(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "analyse_commission_structures");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    if (!session.programmes.length) session.programmes = discoverProgrammes(input);
    const commissionComparisons = analyseCommissions(input, session.programmes);
    session.commissionComparisons = commissionComparisons;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "analyse_commission_structures",
      validation: {
        decision: commissionComparisons.some((c) => c.evidencePresent)
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: commissionComparisons.some((c) => c.evidencePresent)
          ? []
          : ["Commission evidence missing — comparisons marked unknown"],
      },
      latestReport: this.store.getLatestReport(),
      commissionComparisons,
      notes: [`Compared ${commissionComparisons.length} commission structure(s)`],
    };
  }

  estimateMarketDemand(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "estimate_market_demand");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    if (!session.niches.length) session.niches = researchNiches(input);
    const demandAssessment = estimateDemand(input, session.niches);
    session.demandAssessment = demandAssessment;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "estimate_market_demand",
      validation: {
        decision: demandAssessment.evidencePresent ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: demandAssessment.evidencePresent
          ? []
          : ["Demand unknown — no fixture signals; not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      demandAssessment,
      notes: demandAssessment.notes,
    };
  }

  compareCompetingOpportunities(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "compare_competing_opportunities");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    if (!session.niches.length) session.niches = researchNiches(input);
    const competitionAssessment = assessCompetition(input, session.niches);
    session.competitionAssessment = competitionAssessment;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "compare_competing_opportunities",
      validation: {
        decision: competitionAssessment.evidencePresent ? ("pass" as const) : ("partial" as const),
        errors: [],
        warnings: competitionAssessment.evidencePresent
          ? []
          : ["Competition unknown — no fixture; not fabricated"],
      },
      latestReport: this.store.getLatestReport(),
      competitionAssessment,
      notes: competitionAssessment.notes,
    };
  }

  rankOpportunities(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "rank_opportunities");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    const opportunityRanking = rankOpportunities(
      session.programmes,
      session.products,
      session.niches,
      session.commissionComparisons,
      session.demandAssessment!,
      session.competitionAssessment!,
    );
    session.opportunityRanking = opportunityRanking;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "rank_opportunities",
      validation: {
        decision: opportunityRanking.some((r) => r.opportunityScore != null)
          ? ("pass" as const)
          : ("partial" as const),
        errors: [],
        warnings: [],
      },
      latestReport: this.store.getLatestReport(),
      opportunityRanking,
      notes: [`Ranked ${opportunityRanking.length} opportunity(ies) from observed evidence`],
    };
  }

  identifyRisks(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "identify_risks");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (!session.opportunityRanking.length) {
      session.opportunityRanking = rankOpportunities(
        session.programmes,
        session.products,
        session.niches,
        session.commissionComparisons,
        session.demandAssessment!,
        session.competitionAssessment!,
      );
    }
    const risks = identifyRisks(
      session.programmes,
      session.commissionComparisons,
      session.demandAssessment!,
      session.competitionAssessment!,
      session.opportunityRanking,
    );
    session.risks = risks;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "identify_risks",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      risks,
      notes: [`Identified ${risks.length} risk(s) from observed gaps and signals`],
    };
  }

  recommendHighPotentialOpportunities(
    input: AowInput,
    config: AffiliateOpportunityWorkerConfiguration,
  ) {
    const blocked = this.gate(input, config, "recommend_high_potential_opportunities");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (!session.opportunityRanking.length) {
      session.opportunityRanking = rankOpportunities(
        session.programmes,
        session.products,
        session.niches,
        session.commissionComparisons,
        session.demandAssessment!,
        session.competitionAssessment!,
      );
    }
    if (!session.risks.length) {
      session.risks = identifyRisks(
        session.programmes,
        session.commissionComparisons,
        session.demandAssessment!,
        session.competitionAssessment!,
        session.opportunityRanking,
      );
    }
    const recommendation = recommendFromRanking(session.opportunityRanking, session.risks);
    session.recommendation = recommendation;
    session.updatedAt = new Date().toISOString();
    this.store.saveSession(session);
    return {
      action: "recommend_high_potential_opportunities",
      validation: { decision: "pass" as const, errors: [], warnings: [] },
      latestReport: this.store.getLatestReport(),
      opportunityRanking: session.opportunityRanking,
      risks: session.risks,
      recommendation,
      notes: [`Recommendation=${recommendation}`],
    };
  }

  produceAffiliateOpportunityReport(
    input: AowInput,
    config: AffiliateOpportunityWorkerConfiguration,
  ) {
    const blocked = this.gate(input, config, "produce_affiliate_opportunity_report");
    if (blocked) return blocked;
    const session = this.ensureSession(input, config);
    this.hydrateSession(session, input);
    if (!session.opportunityRanking.length) {
      session.opportunityRanking = rankOpportunities(
        session.programmes,
        session.products,
        session.niches,
        session.commissionComparisons,
        session.demandAssessment!,
        session.competitionAssessment!,
      );
    }
    if (!session.risks.length) {
      session.risks = identifyRisks(
        session.programmes,
        session.commissionComparisons,
        session.demandAssessment!,
        session.competitionAssessment!,
        session.opportunityRanking,
      );
    }
    if (!session.recommendation) {
      session.recommendation = recommendFromRanking(session.opportunityRanking, session.risks);
    }

    const top = session.opportunityRanking[0];
    const primaryCommission =
      session.commissionComparisons.find((c) => c.programmeId === top?.programmeId) ??
      session.commissionComparisons[0] ?? {
        programmeId: "unknown",
        programmeName: "unknown",
        commissionPercent: null,
        cookieDays: null,
        payoutFrequency: null,
        comparisonNotes: ["No commission evidence"],
        fabricated: false as const,
        evidencePresent: false,
      };

    const confidenceScore = computeConfidence({
      programmes: session.programmes.length,
      products: session.products.length,
      niches: session.niches.length,
      commissionEvidence: session.commissionComparisons.some((c) => c.evidencePresent),
      demandEvidence: Boolean(session.demandAssessment?.evidencePresent),
      competitionEvidence: Boolean(session.competitionAssessment?.evidencePresent),
      hasScore: top?.opportunityScore != null,
    });

    const now = new Date().toISOString();
    const report: AffiliateOpportunityReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: session.affiliateProjectId,
      programmeName: top?.programmeName ?? session.programmes[0]?.programmeName ?? "unknown",
      productCategory:
        top?.productCategory ??
        session.products[0]?.category ??
        input.productCategory ??
        "unknown",
      targetNiche: top?.targetNiche ?? session.niches[0]?.name ?? input.niche ?? "unknown",
      commissionStructure: primaryCommission,
      estimatedDemand: session.demandAssessment?.estimatedDemand ?? "unknown",
      competitionSummary: session.competitionAssessment?.summary ?? "unknown",
      opportunityScore: top?.opportunityScore ?? null,
      risks: session.risks.map((r) => ({ ...r })),
      recommendation: session.recommendation ?? "insufficient_evidence",
      auditStatus: top?.opportunityScore != null ? "ready_for_q803" : "research_ready",
      confidenceScore,
      metadataVersion: AOW_METADATA_VERSION,
      reportVersion: AFFILIATE_OPPORTUNITY_REPORT_VERSION,
      workerId: config.workerId || AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      affiliateBusinessId: session.affiliateBusinessId,
      programmes: session.programmes.map((p) => ({ ...p })),
      products: session.products.map((p) => ({ ...p })),
      niches: session.niches.map((n) => ({ ...n })),
      commissionComparisons: session.commissionComparisons.map((c) => ({
        ...c,
        comparisonNotes: [...c.comparisonNotes],
      })),
      demandAssessment: session.demandAssessment!,
      competitionAssessment: session.competitionAssessment!,
      seasonalNotes: session.demandAssessment?.seasonality
        ? [`seasonality=${session.demandAssessment.seasonality}`]
        : [],
      opportunityRanking: session.opportunityRanking.map((r) => ({
        ...r,
        scoreBasis: [...r.scoreBasis],
      })),
      evidenceSources: [
        ...(input.fixtureProgrammes?.length ? ["fixtureProgrammes"] : []),
        ...(input.fixtureProducts?.length ? ["fixtureProducts"] : []),
        ...(input.fixtureNiches?.length ? ["fixtureNiches"] : []),
        ...(input.fixtureCommissionData?.length ? ["fixtureCommissionData"] : []),
        ...(input.fixtureDemandSignals?.length ? ["fixtureDemandSignals"] : []),
        ...(input.fixtureCompetition?.length ? ["fixtureCompetition"] : []),
      ],
      evidenceMode: session.evidenceMode,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ803: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-02:affiliate_business:${session.affiliateBusinessId}`,
        `q8-02:affiliate_project:${session.affiliateProjectId}`,
        `q8-02:programmes:${session.programmes.length}`,
        `q8-02:ranking:${session.opportunityRanking.length}`,
      ],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveResearchEvidence: true,
      preserveAuditHistory: true,
      neverFabricateCommissionOrDemandData: true,
      neverCreateAffiliateContent: true,
      neverPublishWebsites: true,
      neverJoinAffiliateProgrammesAutomatically: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ803OrLater: true,
    };

    const shapeErrors = validateReportShape(report);
    if (shapeErrors.length) {
      report.validation = { decision: "fail", errors: shapeErrors, warnings: [] };
    } else if (confidenceScore < 0.5) {
      report.validation = {
        decision: "partial",
        errors: [],
        warnings: ["Low confidence due to incomplete evidence"],
      };
    }

    this.store.saveReport(report);
    session.updatedAt = now;
    this.store.saveSession(session);
    appendAowLog({
      event: "produce_report",
      details: `reportId=${report.reportId}; score=${report.opportunityScore}`,
    });

    return {
      action: "produce_affiliate_opportunity_report",
      validation: report.validation,
      latestReport: report,
      programmes: report.programmes,
      products: report.products,
      niches: report.niches,
      commissionComparisons: report.commissionComparisons,
      demandAssessment: report.demandAssessment,
      competitionAssessment: report.competitionAssessment,
      opportunityRanking: report.opportunityRanking,
      risks: report.risks,
      recommendation: report.recommendation,
      notes: ["Affiliate Opportunity Report produced from observed fixture evidence only"],
    };
  }

  produceReport(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    return this.produceAffiliateOpportunityReport(input, config);
  }

  submitReport(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
    const blocked = this.gate(input, config, "submit_report");
    if (blocked) return blocked;
    let report = this.store.getLatestReport();
    if (!report) {
      const produced = this.produceAffiliateOpportunityReport(input, config);
      if (produced.validation.decision === "fail" || !produced.latestReport) return produced;
      report = produced.latestReport;
    }
    const { submitted, executiveReportId } = this.integrations.submitReport(report);
    const updated: AffiliateOpportunityReport = {
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

  validate(input: AowInput, config: AffiliateOpportunityWorkerConfiguration) {
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
        `opportunities=${record.totalOpportunities}`,
        `health=${record.healthStatus}`,
      ],
      engineRecord: record,
      handshakes: this.integrations.getHandshakes(),
    };
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getCatalog(): AffiliateOpportunityWorkerCatalog {
    const record = this.store.getEngineRecord();
    return {
      workerId: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      workerName: AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerName,
      capabilities: [...AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.skillProfile],
      evidenceModes: ["fixture", "sandbox", "cached", "live"],
      totalReports: record.totalReports,
      totalOpportunities: record.totalOpportunities,
    };
  }

  getQ803ConsumableContract(): Q803ConsumableContract {
    return {
      contractVersion: "AOW-Q803-v1",
      consumableByQ803: true,
      fields: [
        "reportId",
        "affiliateProjectId",
        "affiliateBusinessId",
        "programmeName",
        "productCategory",
        "targetNiche",
        "commissionStructure",
        "estimatedDemand",
        "competitionSummary",
        "opportunityScore",
        "opportunityRanking",
        "risks",
        "recommendation",
        "confidenceScore",
        "evidenceSources",
        "traceabilityRefs",
      ] as const,
      types: {
        AffiliateOpportunityReport: "AffiliateOpportunityReport",
        RankedOpportunity: "RankedOpportunity",
        CommissionStructure: "CommissionStructure",
        DemandAssessment: "DemandAssessment",
      },
      notes: [
        "Q8-03 may consume opportunity research packages only.",
        "Commission and demand values reflect fixture/evidence inputs — never fabricated.",
        "AOW never creates content, publishes websites, or joins programmes automatically.",
      ],
      neverFabricateCommissionOrDemandData: true,
      neverCreateAffiliateContent: true,
      neverPublishWebsites: true,
      neverJoinAffiliateProgrammesAutomatically: true,
    };
  }

  private hydrateSession(session: OpportunitySession, input: AowInput) {
    if (!session.programmes.length) session.programmes = discoverProgrammes(input);
    if (!session.products.length) session.products = discoverProducts(input);
    if (!session.niches.length) session.niches = researchNiches(input);
    if (!session.commissionComparisons.length) {
      session.commissionComparisons = analyseCommissions(input, session.programmes);
    }
    if (!session.demandAssessment) {
      session.demandAssessment = estimateDemand(input, session.niches);
    }
    if (!session.competitionAssessment) {
      session.competitionAssessment = assessCompetition(input, session.niches);
    }
  }
}
