import type { LocalMarketResearchWorkerConfiguration } from "./configuration.js";
import {
  hasObservableFixtureContent,
  normalizeEvidenceMode,
  resolveFixtureFromInput,
} from "./evidence-adapters.js";
import {
  LOCAL_MARKET_RESEARCH_REPORT_VERSION,
  LOCAL_MARKET_RESEARCH_WORKER_IDENTITY,
  LMRW_METADATA_VERSION,
} from "./paths.js";
import {
  provideAssumptions,
  provideAttractiveness,
  provideCompetitorServices,
  provideCompetitors,
  provideCustomerSegments,
  provideDemandFindings,
  provideEvidenceRecords,
  provideOpportunities,
  providePainPoints,
  providePricingFindings,
  provideRisks,
  provideServiceGaps,
  provideUnknowns,
} from "./research-providers.js";
import type {
  EvidenceMode,
  IntegrationHandshake,
  LocalMarketResearchInput,
  LocalMarketResearchReport,
  LocalMarketResearchWorkerCatalog,
  ResearchContext,
  ResearchFixturePayload,
  ResearchSession,
} from "./types.js";

let researchSeq = 0;

export function resetResearchSequenceForTesting() {
  researchSeq = 0;
}

export function nextResearchId() {
  researchSeq += 1;
  return `lmrw-res-${String(researchSeq).padStart(4, "0")}`;
}

export class ResearchBuilder {
  buildCatalog(
    config: LocalMarketResearchWorkerConfiguration,
    reports: LocalMarketResearchReport[],
    sessions: ResearchSession[],
    integrations: IntegrationHandshake[],
  ): LocalMarketResearchWorkerCatalog {
    return {
      reportVersion: LOCAL_MARKET_RESEARCH_REPORT_VERSION,
      workerId: config.workerId,
      reports: reports.map((r) => ({ ...r })),
      sessions: sessions.map((s) => ({ ...s })),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: LMRW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverFinalizeServicePackages: true,
      neverSetFinalPrices: true,
      neverMakeLaunchDecisions: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ703OrLater: true,
      consumableByQ703: true,
    };
  }

  createSession(
    input: LocalMarketResearchInput,
    fixture: ResearchFixturePayload | null,
  ): ResearchSession {
    const now = new Date().toISOString();
    const researchId = input.researchId?.trim() || nextResearchId();
    const segments = [
      ...(input.customerSegments ?? []),
      ...(input.customerSegment ? [input.customerSegment] : []),
    ]
      .map((s) => String(s).trim())
      .filter(Boolean);
    return {
      researchId,
      createdAt: now,
      updatedAt: now,
      status: "open",
      input: { ...input },
      customerSegments: [...new Set(segments)],
      demandFindings: null,
      competitorProfiles: [],
      pricingFindings: null,
      customerPainPoints: [],
      serviceGaps: [],
      opportunityFindings: [],
      marketAttractivenessAssessment: null,
      evidenceSources: [],
      risks: [],
      assumptions: [],
      unknowns: [],
      evidenceMode: normalizeEvidenceMode(fixture?.evidenceMode ?? "fixture"),
      fixture,
    };
  }

  buildContext(
    session: ResearchSession,
    externalFixture?: ResearchFixturePayload | null,
  ): ResearchContext {
    const fixture =
      externalFixture ??
      session.fixture ??
      resolveFixtureFromInput(session.input);
    const evidenceMode = normalizeEvidenceMode(
      fixture?.evidenceMode ?? session.evidenceMode ?? "fixture",
    );
    return {
      researchId: session.researchId,
      targetCountry: String(session.input.targetCountry ?? "").trim(),
      targetCity: String(session.input.targetCity ?? "").trim(),
      targetServiceArea: String(session.input.targetServiceArea ?? "").trim(),
      serviceCategory: String(session.input.serviceCategory ?? "").trim(),
      customerSegments: [...session.customerSegments],
      searchRadius: String(session.input.searchRadius ?? "unspecified"),
      currency: String(session.input.currency ?? "unspecified"),
      preferredResearchPeriod: String(session.input.preferredResearchPeriod ?? "unspecified"),
      businessConstraints: Array.isArray(session.input.businessConstraints)
        ? session.input.businessConstraints.map(String)
        : [],
      availableBudget: String(session.input.availableBudget ?? "unspecified"),
      businessProjectId: String(session.input.businessProjectId ?? "unspecified"),
      evidenceMode,
      fixture,
      providedEvidence: Array.isArray(fixture?.evidence) ? fixture.evidence : [],
      now: new Date().toISOString(),
    };
  }

  applyDemand(session: ResearchSession, fixture?: ResearchFixturePayload | null): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      demandFindings: provideDemandFindings(ctx),
      evidenceSources: provideEvidenceRecords(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applySegments(session: ResearchSession, fixture?: ResearchFixturePayload | null): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      customerSegments: provideCustomerSegments(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyCompetitors(
    session: ResearchSession,
    fixture?: ResearchFixturePayload | null,
  ): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      competitorProfiles: provideCompetitors(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyCompetitorServices(
    session: ResearchSession,
    fixture?: ResearchFixturePayload | null,
  ): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    const services = provideCompetitorServices(ctx);
    const competitors = provideCompetitors(ctx).map((c) =>
      c.services.length ? c : { ...c, services: services.length ? [...services] : c.services },
    );
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      competitorProfiles: competitors,
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyPricing(session: ResearchSession, fixture?: ResearchFixturePayload | null): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      pricingFindings: providePricingFindings(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyPainPoints(
    session: ResearchSession,
    fixture?: ResearchFixturePayload | null,
  ): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      customerPainPoints: providePainPoints(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyGaps(session: ResearchSession, fixture?: ResearchFixturePayload | null): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      serviceGaps: provideServiceGaps(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyOpportunities(
    session: ResearchSession,
    fixture?: ResearchFixturePayload | null,
  ): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      opportunityFindings: provideOpportunities(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  applyAttractiveness(
    session: ResearchSession,
    fixture?: ResearchFixturePayload | null,
  ): ResearchSession {
    const ctx = this.buildContext(session, fixture);
    return {
      ...session,
      updatedAt: ctx.now,
      status: "researching",
      marketAttractivenessAssessment: provideAttractiveness(ctx),
      evidenceMode: ctx.evidenceMode,
      fixture: ctx.fixture,
    };
  }

  assembleReport(
    session: ResearchSession,
    config: LocalMarketResearchWorkerConfiguration,
    fixture?: ResearchFixturePayload | null,
  ): LocalMarketResearchReport {
    let working = { ...session };
    const ctx = this.buildContext(working, fixture);

    if (!working.demandFindings) working = this.applyDemand(working, ctx.fixture);
    if (!working.customerSegments.length) working = this.applySegments(working, ctx.fixture);
    if (!working.competitorProfiles.length) working = this.applyCompetitors(working, ctx.fixture);
    if (!working.pricingFindings) working = this.applyPricing(working, ctx.fixture);
    if (!working.customerPainPoints.length) working = this.applyPainPoints(working, ctx.fixture);
    if (!working.serviceGaps.length) working = this.applyGaps(working, ctx.fixture);
    if (!working.opportunityFindings.length) {
      working = this.applyOpportunities(working, ctx.fixture);
    }
    if (!working.marketAttractivenessAssessment) {
      working = this.applyAttractiveness(working, ctx.fixture);
    }

    const finalCtx = this.buildContext(working, ctx.fixture);
    const evidenceSources =
      working.evidenceSources.length > 0
        ? working.evidenceSources
        : provideEvidenceRecords(finalCtx);
    const risks = working.risks.length ? working.risks : provideRisks(finalCtx);
    const assumptions = working.assumptions.length
      ? working.assumptions
      : provideAssumptions(finalCtx);
    const unknowns = working.unknowns.length ? working.unknowns : provideUnknowns(finalCtx);
    const confidenceScore = computeConfidenceFromEvidenceDensity(working, evidenceSources);
    const followUps = buildFollowUps(working, finalCtx.fixture);
    const executiveSummary = buildExecutiveSummary(working, confidenceScore, finalCtx);

    return lockReport({
      researchId: working.researchId,
      timestamp: finalCtx.now,
      businessProjectId: finalCtx.businessProjectId,
      targetCountry: finalCtx.targetCountry,
      targetCity: finalCtx.targetCity,
      targetServiceArea: finalCtx.targetServiceArea,
      serviceCategory: finalCtx.serviceCategory,
      customerSegments: [...working.customerSegments],
      demandFindings: working.demandFindings!,
      competitorProfiles: working.competitorProfiles,
      pricingFindings: working.pricingFindings!,
      customerPainPoints: working.customerPainPoints,
      serviceGaps: working.serviceGaps,
      opportunityFindings: working.opportunityFindings,
      marketAttractivenessAssessment: working.marketAttractivenessAssessment!,
      risks,
      assumptions,
      unknowns,
      evidenceSources,
      confidenceScore,
      recommendedResearchFollowUps: followUps,
      executiveSummary,
      metadataVersion: LMRW_METADATA_VERSION,
      reportVersion: LOCAL_MARKET_RESEARCH_REPORT_VERSION,
      workerId: config.workerId || LOCAL_MARKET_RESEARCH_WORKER_IDENTITY.workerId,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs: [
        `q7-02:local_market_research:${working.researchId}`,
        `q7-02:business_project:${finalCtx.businessProjectId}`,
        `q7-02:location:${finalCtx.targetCountry}/${finalCtx.targetCity}/${finalCtx.targetServiceArea}`,
        `q7-02:service_category:${finalCtx.serviceCategory}`,
        `q7-02:evidence_mode:${finalCtx.evidenceMode}`,
      ],
      evidenceMode: finalCtx.evidenceMode,
      consumableByQ703: true,
      neverFinalizeServicePackages: true,
      neverSetFinalPrices: true,
      neverMakeLaunchDecisions: true,
      neverBuildBookingSystems: true,
      neverBuildWebsites: true,
      neverContactCustomersOrCompetitorsWithoutApproval: true,
      neverPurchaseDataOrAdvertisingWithoutApproval: true,
      neverFabricateDemandPricingOrCompetitorData: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ703OrLater: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      neverExposeCredentials: true,
      neverExposeProhibitedPersonalData: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    });
  }
}

function countNonUnknownEvidenced(
  items: Array<{ evidenceClass: string }> | undefined,
): number {
  if (!items?.length) return 0;
  return items.filter((i) => i.evidenceClass !== "unknown").length;
}

function computeConfidenceFromEvidenceDensity(
  session: ResearchSession,
  evidence: Array<{ evidenceClass: string }>,
): number {
  let observed = 0;
  let slots = 0;

  const demand = session.demandFindings;
  if (demand) {
    const groups = [
      demand.demandIndicators,
      demand.searchPatterns,
      demand.frequencySignals,
      demand.urgencySignals,
      demand.seasonalPatterns,
      demand.residentialVsCommercial,
      demand.segmentDifferences,
      demand.geographicConcentration,
      demand.repeatPotential,
      demand.emergencyPotential,
    ];
    for (const group of groups) {
      slots += 1;
      if (countNonUnknownEvidenced(group) > 0) observed += 1;
    }
  } else {
    slots += 10;
  }

  slots += 1;
  if (session.competitorProfiles.some((c) => c.evidenceClass !== "unknown")) observed += 1;

  slots += 1;
  if (
    session.pricingFindings &&
    session.pricingFindings.typicalPriceRange.evidenceClass !== "unknown"
  ) {
    observed += 1;
  }

  slots += 1;
  if (session.customerPainPoints.some((p) => p.evidenceClass !== "unknown")) observed += 1;

  slots += 1;
  if (session.serviceGaps.some((g) => g.evidenceClass !== "unknown")) observed += 1;

  slots += 1;
  if (session.opportunityFindings.some((o) => o.evidenceClass !== "unknown")) observed += 1;

  slots += 1;
  if (
    session.marketAttractivenessAssessment &&
    session.marketAttractivenessAssessment.overallOpportunityConfidence.evidenceClass !==
      "unknown"
  ) {
    observed += 1;
  }

  slots += 1;
  if (evidence.some((e) => e.evidenceClass !== "unknown")) observed += 1;

  if (!hasObservableFixtureContent(session.fixture) && observed === 0) {
    return 0.05;
  }

  const ratio = slots === 0 ? 0 : observed / slots;
  return Math.max(0.05, Math.min(0.95, Number(ratio.toFixed(2))));
}

function buildFollowUps(
  session: ResearchSession,
  fixture: ResearchFixturePayload | null,
): string[] {
  const followUps: string[] = [];
  if (!fixture || !hasObservableFixtureContent(fixture)) {
    followUps.push("Provide fixture, sandbox, cached, or approved live evidence before relying on findings");
  }
  if (!session.competitorProfiles.length) {
    followUps.push("Collect approved competitor evidence for the target service area");
  }
  if (
    !session.pricingFindings ||
    session.pricingFindings.typicalPriceRange.evidenceClass === "unknown"
  ) {
    followUps.push("Collect approved local pricing evidence (no final price setting)");
  }
  if (!session.customerPainPoints.length) {
    followUps.push("Collect customer pain-point evidence without contacting customers without approval");
  }
  followUps.push("Hand off structural findings to Q7-03 Service Offer Worker when approved");
  return followUps;
}

function buildExecutiveSummary(
  session: ResearchSession,
  confidence: number,
  ctx: ResearchContext,
): string {
  const competitorCount = session.competitorProfiles.length;
  const gapCount = session.serviceGaps.length;
  const opportunityCount = session.opportunityFindings.length;
  const mode: EvidenceMode = ctx.evidenceMode;
  return [
    `Local market research for ${ctx.serviceCategory} in ${ctx.targetCity}/${ctx.targetServiceArea}, ${ctx.targetCountry}.`,
    `Evidence mode=${mode}; competitors=${competitorCount}; gaps=${gapCount}; opportunities=${opportunityCount}; confidence=${confidence}.`,
    "Structural signals only — no final packages, final prices, or launch decisions.",
  ].join(" ");
}

function lockReport(report: LocalMarketResearchReport): LocalMarketResearchReport {
  return {
    ...report,
    consumableByQ703: true,
    neverFinalizeServicePackages: true,
    neverSetFinalPrices: true,
    neverMakeLaunchDecisions: true,
    neverBuildBookingSystems: true,
    neverBuildWebsites: true,
    neverContactCustomersOrCompetitorsWithoutApproval: true,
    neverPurchaseDataOrAdvertisingWithoutApproval: true,
    neverFabricateDemandPricingOrCompetitorData: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ703OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeProhibitedPersonalData: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
