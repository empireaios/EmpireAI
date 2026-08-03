import type { AffiliateOpportunityWorkerConfiguration } from "./configuration.js";
import {
  hasObservableFixtureContent,
  normalizeEvidenceMode,
  resolveFixtureFromInput,
  type OpportunityFixturePayload,
} from "./evidence-adapters.js";
import {
  AFFILIATE_OPPORTUNITY_REPORT_VERSION,
  AFFILIATE_OPPORTUNITY_WORKER_IDENTITY,
  AOW_METADATA_VERSION,
} from "./paths.js";
import {
  analyseCommissions,
  assessCompetition,
  computeConfidence as computeConfidenceParts,
  discoverProducts,
  discoverProgrammes,
  estimateDemand,
  identifyRisks,
  rankOpportunities,
  recommendFromRanking,
  researchNiches,
} from "./opportunity-providers.js";
import { nextReportId, nextSessionId } from "./opportunity-store.js";
import type {
  AffiliateOpportunityReport,
  AffiliateOpportunityWorkerCatalog,
  AowInput,
  IntegrationHandshake,
  OpportunitySession,
  RankedOpportunity,
} from "./types.js";

export type { OpportunityFixturePayload };

export function resetAssessmentSequenceForTesting() {
  // Session IDs are owned by opportunity-store; retained for API compatibility.
}

export function nextAssessmentId() {
  return nextSessionId();
}

export function resetReportSequenceForTesting() {
  // Report IDs are owned by opportunity-store; retained for API compatibility.
}

function resolveAffiliateProjectId(input: AowInput, fallback: string | null): string {
  return (
    input.affiliateProjectId?.trim() ||
    input.factoryProjectId?.trim() ||
    input.affiliateBusinessId?.trim() ||
    fallback ||
    "unspecified"
  );
}

function resolveAffiliateBusinessId(input: AowInput, fallback: string | null): string {
  return (
    input.affiliateBusinessId?.trim() ||
    input.affiliateProjectId?.trim() ||
    input.factoryProjectId?.trim() ||
    fallback ||
    "unspecified"
  );
}

function inputFromSession(session: OpportunitySession, fixture: OpportunityFixturePayload | null): AowInput {
  return {
    affiliateProjectId: session.affiliateProjectId,
    affiliateBusinessId: session.affiliateBusinessId,
    evidenceMode: session.evidenceMode,
    fixtureProgrammes: fixture?.programmes ?? undefined,
    fixtureProducts: fixture?.products ?? undefined,
    fixtureNiches: fixture?.niches ?? undefined,
    fixtureCommissionData: fixture?.commissionData ?? undefined,
    fixtureDemandSignals: fixture?.demandSignals ?? undefined,
    fixtureCompetition: fixture?.competition ?? undefined,
  };
}

function evidenceSourceLabels(fixture: OpportunityFixturePayload | null): string[] {
  if (!fixture) return [];
  return [
    ...(fixture.programmes?.length ? ["fixtureProgrammes"] : []),
    ...(fixture.products?.length ? ["fixtureProducts"] : []),
    ...(fixture.niches?.length ? ["fixtureNiches"] : []),
    ...(fixture.commissionData?.length ? ["fixtureCommissionData"] : []),
    ...(fixture.demandSignals?.length ? ["fixtureDemandSignals"] : []),
    ...(fixture.competition?.length ? ["fixtureCompetition"] : []),
  ];
}

export class OpportunityBuilder {
  buildCatalog(
    config: AffiliateOpportunityWorkerConfiguration,
    reports: AffiliateOpportunityReport[],
    _sessions: OpportunitySession[],
    opportunities: RankedOpportunity[],
    _integrations: IntegrationHandshake[],
  ): AffiliateOpportunityWorkerCatalog {
    return {
      workerId: config.workerId || AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      workerName: config.workerName || AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerName,
      capabilities: [...AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.skillProfile],
      evidenceModes: ["fixture", "sandbox", "cached", "live"],
      totalReports: reports.length,
      totalOpportunities: opportunities.length,
    };
  }

  createSession(
    input: AowInput,
    fixture: OpportunityFixturePayload | null,
    latestAffiliateBusinessId: string | null,
  ): OpportunitySession {
    const now = new Date().toISOString();
    const resolvedFixture = fixture ?? resolveFixtureFromInput(input);
    return {
      sessionId: nextSessionId(),
      affiliateProjectId: resolveAffiliateProjectId(input, latestAffiliateBusinessId),
      affiliateBusinessId: resolveAffiliateBusinessId(input, latestAffiliateBusinessId),
      evidenceMode: normalizeEvidenceMode(resolvedFixture?.evidenceMode ?? input.evidenceMode ?? "fixture"),
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
  }

  applyProgrammes(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? resolveFixtureFromInput({
      evidenceMode: session.evidenceMode,
    }));
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      programmes: discoverProgrammes(input),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyProducts(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? null);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      products: discoverProducts(input),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyNiches(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? null);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      niches: researchNiches(input),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyCommissionComparisons(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? null);
    const programmes = session.programmes.length ? session.programmes : discoverProgrammes(input);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      programmes,
      commissionComparisons: analyseCommissions(input, programmes),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyDemandAssessment(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? null);
    const niches = session.niches.length ? session.niches : researchNiches(input);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      niches,
      demandAssessment: estimateDemand(input, niches),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyCompetitionAssessment(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    const input = inputFromSession(session, fixture ?? null);
    const niches = session.niches.length ? session.niches : researchNiches(input);
    return {
      ...session,
      updatedAt: new Date().toISOString(),
      niches,
      competitionAssessment: assessCompetition(input, niches),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? session.evidenceMode),
    };
  }

  applyOpportunityRanking(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    let working = { ...session };
    const input = inputFromSession(working, fixture ?? null);
    if (!working.programmes.length) working = this.applyProgrammes(working, fixture);
    if (!working.products.length) working = this.applyProducts(working, fixture);
    if (!working.niches.length) working = this.applyNiches(working, fixture);
    if (!working.commissionComparisons.length) {
      working = this.applyCommissionComparisons(working, fixture);
    }
    if (!working.demandAssessment) working = this.applyDemandAssessment(working, fixture);
    if (!working.competitionAssessment) {
      working = this.applyCompetitionAssessment(working, fixture);
    }
    void input;
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      opportunityRanking: rankOpportunities(
        working.programmes,
        working.products,
        working.niches,
        working.commissionComparisons,
        working.demandAssessment!,
        working.competitionAssessment!,
      ),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? working.evidenceMode),
    };
  }

  applyRisks(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    let working = { ...session };
    if (!working.programmes.length) working = this.applyProgrammes(working, fixture);
    if (!working.commissionComparisons.length) {
      working = this.applyCommissionComparisons(working, fixture);
    }
    if (!working.demandAssessment) working = this.applyDemandAssessment(working, fixture);
    if (!working.competitionAssessment) {
      working = this.applyCompetitionAssessment(working, fixture);
    }
    if (!working.opportunityRanking.length) {
      working = this.applyOpportunityRanking(working, fixture);
    }
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      risks: identifyRisks(
        working.programmes,
        working.commissionComparisons,
        working.demandAssessment!,
        working.competitionAssessment!,
        working.opportunityRanking,
      ),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? working.evidenceMode),
    };
  }

  applyRecommendations(
    session: OpportunitySession,
    fixture?: OpportunityFixturePayload | null,
  ): OpportunitySession {
    let working = { ...session };
    if (!working.opportunityRanking.length) {
      working = this.applyOpportunityRanking(working, fixture);
    }
    if (!working.risks.length) working = this.applyRisks(working, fixture);
    return {
      ...working,
      updatedAt: new Date().toISOString(),
      recommendation: recommendFromRanking(working.opportunityRanking, working.risks),
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? working.evidenceMode),
    };
  }

  assembleReport(
    session: OpportunitySession,
    config: AffiliateOpportunityWorkerConfiguration,
    fixture?: OpportunityFixturePayload | null,
  ): AffiliateOpportunityReport {
    let working = { ...session };
    const resolvedFixture = fixture ?? resolveFixtureFromInput(inputFromSession(working, null));

    if (!working.programmes.length) working = this.applyProgrammes(working, resolvedFixture);
    if (!working.products.length) working = this.applyProducts(working, resolvedFixture);
    if (!working.niches.length) working = this.applyNiches(working, resolvedFixture);
    if (!working.commissionComparisons.length) {
      working = this.applyCommissionComparisons(working, resolvedFixture);
    }
    if (!working.demandAssessment) working = this.applyDemandAssessment(working, resolvedFixture);
    if (!working.competitionAssessment) {
      working = this.applyCompetitionAssessment(working, resolvedFixture);
    }
    if (!working.opportunityRanking.length) {
      working = this.applyOpportunityRanking(working, resolvedFixture);
    }
    if (!working.risks.length) working = this.applyRisks(working, resolvedFixture);
    if (!working.recommendation) {
      working = this.applyRecommendations(working, resolvedFixture);
    }

    const top = working.opportunityRanking[0];
    const primaryCommission =
      working.commissionComparisons.find((c) => c.programmeId === top?.programmeId) ??
      working.commissionComparisons[0] ?? {
        programmeId: "unknown",
        programmeName: "unknown",
        commissionPercent: null,
        cookieDays: null,
        payoutFrequency: null,
        comparisonNotes: ["No commission evidence"],
        fabricated: false as const,
        evidencePresent: false,
      };

    const confidenceScore = computeConfidence(working, resolvedFixture);
    const now = new Date().toISOString();
    const report: AffiliateOpportunityReport = {
      reportId: nextReportId(),
      timestamp: now,
      affiliateProjectId: working.affiliateProjectId,
      programmeName: top?.programmeName ?? working.programmes[0]?.programmeName ?? "unknown",
      productCategory: top?.productCategory ?? working.products[0]?.category ?? "unknown",
      targetNiche: top?.targetNiche ?? working.niches[0]?.name ?? "unknown",
      commissionStructure: primaryCommission,
      estimatedDemand: working.demandAssessment?.estimatedDemand ?? "unknown",
      competitionSummary: working.competitionAssessment?.summary ?? "unknown",
      opportunityScore: top?.opportunityScore ?? null,
      risks: working.risks.map((r) => ({ ...r })),
      recommendation: working.recommendation ?? "insufficient_evidence",
      auditStatus: top?.opportunityScore != null ? "ready_for_q803" : "research_ready",
      confidenceScore,
      metadataVersion: AOW_METADATA_VERSION,
      reportVersion: AFFILIATE_OPPORTUNITY_REPORT_VERSION,
      workerId: config.workerId || AFFILIATE_OPPORTUNITY_WORKER_IDENTITY.workerId,
      affiliateBusinessId: working.affiliateBusinessId,
      programmes: working.programmes.map((p) => ({ ...p })),
      products: working.products.map((p) => ({ ...p })),
      niches: working.niches.map((n) => ({ ...n })),
      commissionComparisons: working.commissionComparisons.map((c) => ({
        ...c,
        comparisonNotes: [...c.comparisonNotes],
      })),
      demandAssessment: working.demandAssessment!,
      competitionAssessment: working.competitionAssessment!,
      seasonalNotes: working.demandAssessment?.seasonality
        ? [`seasonality=${working.demandAssessment.seasonality}`]
        : [],
      opportunityRanking: working.opportunityRanking.map((r) => ({
        ...r,
        scoreBasis: [...r.scoreBasis],
      })),
      evidenceSources: evidenceSourceLabels(resolvedFixture),
      evidenceMode: working.evidenceMode,
      validation: { decision: "pass", errors: [], warnings: [] },
      runTimestamp: now,
      consumableByQ803: true,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q8-02:affiliate_business:${working.affiliateBusinessId}`,
        `q8-02:affiliate_project:${working.affiliateProjectId}`,
        `q8-02:programmes:${working.programmes.length}`,
        `q8-02:ranking:${working.opportunityRanking.length}`,
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
    return lockReport(report);
  }
}

function computeConfidence(
  session: OpportunitySession,
  fixture: OpportunityFixturePayload | null,
): number {
  const score = computeConfidenceParts({
    programmes: session.programmes.length,
    products: session.products.length,
    niches: session.niches.length,
    commissionEvidence: session.commissionComparisons.some((c) => c.evidencePresent),
    demandEvidence: Boolean(session.demandAssessment?.evidencePresent),
    competitionEvidence: Boolean(session.competitionAssessment?.evidencePresent),
    hasScore: session.opportunityRanking.some((o) => o.opportunityScore != null),
  });
  if (!hasObservableFixtureContent(fixture) && score === 0) {
    return 0.05;
  }
  return Math.max(0.05, score);
}

function lockReport(report: AffiliateOpportunityReport): AffiliateOpportunityReport {
  return {
    ...report,
    risks: report.risks.map((r) => ({ ...r })),
    programmes: report.programmes.map((p) => ({ ...p })),
    products: report.products.map((p) => ({ ...p })),
    niches: report.niches.map((n) => ({ ...n })),
    commissionComparisons: report.commissionComparisons.map((c) => ({
      ...c,
      comparisonNotes: [...c.comparisonNotes],
    })),
    demandAssessment: {
      ...report.demandAssessment,
      notes: [...report.demandAssessment.notes],
    },
    competitionAssessment: {
      ...report.competitionAssessment,
      notes: [...report.competitionAssessment.notes],
    },
    seasonalNotes: [...report.seasonalNotes],
    opportunityRanking: report.opportunityRanking.map((o) => ({
      ...o,
      scoreBasis: [...o.scoreBasis],
    })),
    evidenceSources: [...report.evidenceSources],
    validation: {
      ...report.validation,
      errors: [...report.validation.errors],
      warnings: [...report.validation.warnings],
    },
    traceabilityRefs: [...report.traceabilityRefs],
    consumableByQ803: true,
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
}
