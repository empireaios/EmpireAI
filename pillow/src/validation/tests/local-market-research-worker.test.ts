import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  EVIDENCE_CLASSES,
  INTEGRATION_TARGETS,
  LOCAL_MARKET_RESEARCH_REPORT_VERSION,
  LMRW_CAPABILITIES,
  LMRW_METADATA_VERSION,
  buildLocalMarketResearchWorkerConfiguration,
  createLocalMarketResearchWorker,
  resetLocalMarketResearchWorkerForTesting,
  type LocalMarketResearchInput,
  type ResearchFixturePayload,
} from "../../local-market-research-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixture(): ResearchFixturePayload {
  return {
    evidenceMode: "fixture",
    customerSegments: ["busy homeowners", "small offices"],
    demand: {
      demandIndicators: [
        { value: "Recurring residential cleaning searches rising", evidenceClass: "verified" },
        { value: "Office end-of-day cleanouts moderate", evidenceClass: "estimated" },
      ],
      searchPatterns: [
        { value: "cleaning near me same day", evidenceClass: "verified" },
      ],
      frequencySignals: [
        { value: "weekly residential / monthly commercial", evidenceClass: "estimated" },
      ],
      urgencySignals: [
        { value: "same-day spill cleanup spikes", evidenceClass: "inference" },
      ],
      seasonalPatterns: [
        { value: "pre-holiday deep cleans", evidenceClass: "estimated" },
      ],
      residentialVsCommercial: [
        { value: "residential-dominant with commercial pockets", evidenceClass: "verified" },
      ],
      segmentDifferences: [
        { value: "homeowners prioritize trust; offices prioritize scheduling", evidenceClass: "inference" },
      ],
      geographicConcentration: [
        { value: "demand denser in CBD fringe apartments", evidenceClass: "estimated" },
      ],
      repeatPotential: [
        { value: "high for weekly residential", evidenceClass: "verified" },
      ],
      emergencyPotential: [
        { value: "moderate for post-event cleanup", evidenceClass: "estimated" },
      ],
    },
    competitors: [
      {
        competitorId: "lmrw-cmp-001",
        name: "Sparkle District Clean",
        serviceArea: "Orchard",
        services: ["residential cleaning", "move-out cleaning"],
        pricingModel: "fixed_package",
        positioning: "premium trusted local",
        availability: "weekday_evenings",
        bookingMethod: "whatsapp",
        channels: ["google_maps", "instagram"],
        ratings: "4.6/5",
        strengths: ["local_reviews", "fast_response"],
        weaknesses: ["limited_weekend_slots"],
        gaps: ["no_eco_products_option"],
        evidenceSource: "fixture_directory",
        researchTimestamp: "2026-08-02T00:00:00.000Z",
        evidenceClass: "verified",
      },
      {
        competitorId: "lmrw-cmp-002",
        name: "Sparkle District Clean",
        serviceArea: "Orchard",
        services: ["residential cleaning"],
        pricingModel: "fixed_package",
        positioning: "duplicate should dedupe",
        availability: "weekday_evenings",
        bookingMethod: "whatsapp",
        channels: ["google_maps"],
        ratings: "4.6/5",
        strengths: ["local_reviews"],
        weaknesses: ["limited_weekend_slots"],
        gaps: [],
        evidenceSource: "fixture_directory",
        researchTimestamp: "2026-08-02T00:00:00.000Z",
        evidenceClass: "estimated",
      },
      {
        competitorId: "lmrw-cmp-003",
        name: "QuickMop Express",
        serviceArea: "Orchard",
        services: ["office cleaning", "residential cleaning"],
        pricingModel: "hourly",
        positioning: "budget speed",
        availability: "7_days",
        bookingMethod: "web_form",
        channels: ["facebook", "google_maps"],
        ratings: "4.1/5",
        strengths: ["price", "availability"],
        weaknesses: ["inconsistent_quality"],
        gaps: ["no_recurring_plans"],
        evidenceSource: "fixture_directory",
        researchTimestamp: "2026-08-02T00:00:00.000Z",
        evidenceClass: "estimated",
      },
    ],
    pricing: {
      typicalPriceRange: { value: "SGD 80-150 per visit", evidenceClass: "verified" },
      minObservedPrice: { value: "SGD 60", evidenceClass: "estimated" },
      maxObservedPrice: { value: "SGD 220", evidenceClass: "estimated" },
      callOutFees: [{ value: "SGD 20-40", evidenceClass: "estimated" }],
      hourlyRates: [{ value: "SGD 35-55/hr", evidenceClass: "verified" }],
      fixedPackages: [{ value: "2BR flat clean SGD 120", evidenceClass: "verified" }],
      emergencySurcharges: [{ value: "+30% after 9pm", evidenceClass: "inference" }],
      materialFees: [{ value: "supplies usually included", evidenceClass: "estimated" }],
      transportFees: [{ value: "rarely itemized within Orchard", evidenceClass: "unknown" }],
      inspectionFees: [{ value: "not commonly charged", evidenceClass: "inference" }],
      recurringPricing: [{ value: "10% weekly discount", evidenceClass: "estimated" }],
      promotions: [{ value: "first-visit 15% off", evidenceClass: "verified" }],
      refundGuaranteePractices: [{ value: "re-clean within 24h", evidenceClass: "estimated" }],
      currency: "SGD",
      taxInclusionStatus: { value: "prices typically include GST ambiguity", evidenceClass: "unknown" },
    },
    painPoints: [
      {
        painPointId: "lmrw-res-pain-001",
        description: "Hard to book reliable same-week cleaners",
        affectedSegment: "busy homeowners",
        severity: "high",
        evidenceClass: "verified",
        supportingEvidence: ["fixture_reviews_cluster"],
      },
    ],
    gaps: [
      {
        gapId: "lmrw-res-gap-001",
        description: "Few eco-certified cleaning packages in Orchard",
        geographicArea: "Orchard",
        unmetNeed: "eco_friendly_recurring_clean",
        evidenceClass: "estimated",
        supportingEvidence: ["fixture_competitor_gap_scan"],
      },
    ],
    opportunities: [
      {
        opportunityId: "lmrw-opp-001",
        description: "Eco recurring residential cleaning for Orchard apartments",
        supportingEvidence: ["lmrw-res-gap-001", "lmrw-res-pain-001"],
        targetCustomer: "busy homeowners",
        geographicArea: "Orchard",
        demandIndication: "moderate_to_high",
        competitionLevel: "moderate",
        pricingIndication: "SGD 100-160 recurring",
        operationalConsiderations: ["supply_eco_consumables", "evening_slots"],
        risks: ["price_sensitivity"],
        confidenceLevel: 0.62,
        evidenceClass: "inference",
      },
    ],
    attractiveness: {
      demandStrength: {
        score: 0.7,
        evidenceClass: "verified",
        explanation: "Verified search and repeat indicators",
        evidenceRefs: ["demand.demandIndicators"],
      },
      competitionIntensity: {
        score: 0.55,
        evidenceClass: "estimated",
        explanation: "Multiple local operators observed",
        evidenceRefs: ["competitors"],
      },
      pricingPotential: {
        score: 0.6,
        evidenceClass: "estimated",
        explanation: "Observed ranges support mid-tier packages",
        evidenceRefs: ["pricing.typicalPriceRange"],
      },
      repeatPurchasePotential: {
        score: 0.75,
        evidenceClass: "verified",
        explanation: "Weekly residential repeat signal",
        evidenceRefs: ["demand.repeatPotential"],
      },
      customerUrgency: {
        score: 0.45,
        evidenceClass: "inference",
        explanation: "Same-day spikes are secondary",
        evidenceRefs: ["demand.urgencySignals"],
      },
      easeOfAcquisition: {
        score: 0.5,
        evidenceClass: "estimated",
        explanation: "Channel competition moderate",
        evidenceRefs: ["competitors"],
      },
      operationalComplexity: {
        score: 0.4,
        evidenceClass: "inference",
        explanation: "Standard cleaning ops",
        evidenceRefs: [],
      },
      entryBarriers: {
        score: 0.35,
        evidenceClass: "estimated",
        explanation: "Low capital; trust/reviews matter",
        evidenceRefs: ["competitors"],
      },
      regulatoryUncertainty: {
        score: 0.3,
        evidenceClass: "unknown",
        explanation: "Licensing details not in fixture",
        evidenceRefs: [],
      },
      overallOpportunityConfidence: {
        score: 0.64,
        evidenceClass: "estimated",
        explanation: "Balanced demand vs competition with evidence gaps remaining",
        evidenceRefs: ["demand", "competitors", "pricing"],
      },
    },
    evidence: [
      {
        evidenceId: "lmrw-ev-0001",
        sourceReference: "fixture_local_directory",
        sourceType: "fixture",
        sourceDate: "2026-08-01",
        retrievalTimestamp: "2026-08-02T00:00:00.000Z",
        geographicRelevance: "Singapore/Orchard",
        serviceRelevance: "cleaning",
        evidenceStrength: "moderate",
        confidenceLevel: 0.7,
        inferenceMade: false,
        evidenceClass: "verified",
        evidenceMode: "fixture",
        claim: "Local cleaning operators and pricing signals observed in fixture set",
      },
    ],
    risks: ["review_density_may_lag_new_entrants"],
    assumptions: ["fixture mirrors near-term Orchard conditions"],
    unknowns: ["licensing_requirements"],
  };
}

function sampleInput(
  overrides: Partial<LocalMarketResearchInput> = {},
): LocalMarketResearchInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    targetCountry: "Singapore",
    targetCity: "Singapore",
    targetServiceArea: "Orchard",
    serviceCategory: "cleaning",
    customerSegment: "busy homeowners",
    searchRadius: "5km",
    currency: "SGD",
    preferredResearchPeriod: "2026-Q3",
    businessConstraints: ["budget_under_5k_setup"],
    availableBudget: 5000,
    grandKingInstructions: "Research only; no launch.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureEvidence: sampleFixture(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createLocalMarketResearchWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createLocalMarketResearchWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-02 Local Market Research Worker", () => {
  beforeEach(resetLocalMarketResearchWorkerForTesting);

  test("1 locks mandatory local-market-research-worker boundaries", () => {
    const c = buildLocalMarketResearchWorkerConfiguration(REPO_ROOT, {
      neverFinalizeServicePackages: false as never,
      neverSetFinalPrices: false as never,
      neverMakeLaunchDecisions: false as never,
      neverBuildBookingSystems: false as never,
      neverBuildWebsites: false as never,
      neverContactCustomersOrCompetitorsWithoutApproval: false as never,
      neverPurchaseDataOrAdvertisingWithoutApproval: false as never,
      neverFabricateDemandPricingOrCompetitorData: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ703OrLater: false as never,
    });
    assert.equal(c.neverFinalizeServicePackages, true);
    assert.equal(c.neverSetFinalPrices, true);
    assert.equal(c.neverMakeLaunchDecisions, true);
    assert.equal(c.neverBuildBookingSystems, true);
    assert.equal(c.neverBuildWebsites, true);
    assert.equal(c.neverContactCustomersOrCompetitorsWithoutApproval, true);
    assert.equal(c.neverPurchaseDataOrAdvertisingWithoutApproval, true);
    assert.equal(c.neverFabricateDemandPricingOrCompetitorData, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ703OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-LMRW-001 for Q7-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-02");
    assert.equal(state.engineVersion, "PILLOW-LMRW-001");
    assert.equal(state.configuration.workerId, "wkr-local-market-research-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(LMRW_CAPABILITIES.includes("research_local_demand"));
  });

  test("3 validates required inputs and rejects incomplete requests", async () => {
    const engine = await build();
    const incomplete = engine.submitResearchRequest({
      serviceCategory: "cleaning",
      validated: true,
    });
    assert.equal(incomplete.validation.decision, "fail");
    assert.equal(incomplete.latestSession, null);

    const validated = engine.validate({
      targetCountry: "Singapore",
      targetCity: "Singapore",
      targetServiceArea: "Orchard",
      serviceCategory: "cleaning",
      validated: true,
    });
    assert.notEqual(validated.validation.decision, "fail");
  });

  test("4 submits research request for location and category", async () => {
    const report = (await build()).submitResearchRequest(sampleInput());
    assert.equal(report.action, "submit_research_request");
    assert.equal(report.validation.decision, "pass");
    assert.ok(report.latestSession);
    assert.ok(report.latestSession!.researchId.startsWith("lmrw-res-"));
    assert.equal(report.latestSession!.input.targetCity, "Singapore");
    assert.equal(report.latestSession!.input.serviceCategory, "cleaning");
    assert.equal(report.latestSession!.input.businessProjectId, "lbfc-prj-cleaning-01");
  });

  test("5 researches local demand from fixture with distinguishable evidence classes", async () => {
    const report = (await build()).researchLocalDemand(sampleInput());
    assert.equal(report.action, "research_local_demand");
    assert.ok(report.latestSession?.demandFindings);
    const classes = new Set(
      report.latestSession!.demandFindings!.demandIndicators.map((d) => d.evidenceClass),
    );
    assert.ok(classes.has("verified"));
    assert.ok(classes.has("estimated"));
    for (const evidenceClass of classes) {
      assert.ok((EVIDENCE_CLASSES as readonly string[]).includes(evidenceClass));
    }
  });

  test("6 builds competitor records from fixture with dedupe", async () => {
    const report = (await build()).researchCompetitors(sampleInput());
    const competitors = report.latestSession!.competitorProfiles;
    assert.equal(competitors.length, 2);
    assert.ok(competitors.some((c) => c.name === "Sparkle District Clean"));
    assert.ok(competitors.some((c) => c.name === "QuickMop Express"));
    assert.ok(competitors[0]!.competitorId.startsWith("lmrw-cmp-"));
  });

  test("7 researches pricing evidence from fixture without final price recommendation", async () => {
    const report = (await build()).researchMarketPricing(sampleInput());
    const pricing = report.latestSession!.pricingFindings!;
    assert.equal(pricing.currency, "SGD");
    assert.equal(pricing.typicalPriceRange.evidenceClass, "verified");
    assert.equal("finalPriceRecommendation" in pricing, false);
  });

  test("8 identifies pain points and service gaps from fixture", async () => {
    const engine = await build();
    const pains = engine.identifyPainPoints(sampleInput());
    const gaps = engine.identifyServiceGaps({
      researchId: pains.latestSession!.researchId,
      validated: true,
      fixtureEvidence: sampleFixture(),
    });
    assert.ok(pains.latestSession!.customerPainPoints.length >= 1);
    assert.ok(gaps.latestSession!.serviceGaps.length >= 1);
    assert.equal(pains.latestSession!.customerPainPoints[0]!.evidenceClass, "verified");
    assert.equal(gaps.latestSession!.serviceGaps[0]!.evidenceClass, "estimated");
  });

  test("9 analyzes service opportunities from evidence", async () => {
    const report = (await build()).analyzeServiceOpportunities(sampleInput());
    assert.ok(report.latestSession!.opportunityFindings.length >= 1);
    assert.ok(report.latestSession!.opportunityFindings[0]!.opportunityId.startsWith("lmrw-opp-"));
    assert.ok(report.latestSession!.opportunityFindings[0]!.supportingEvidence.length >= 1);
  });

  test("10 produces full Local Market Research Report with required fields and consumableByQ703", async () => {
    const report = (await build()).produceLocalMarketResearchReport(sampleInput());
    const latest = report.latestReport!;
    assert.equal(report.validation.decision, "pass");
    assert.ok(latest.researchId.startsWith("lmrw-res-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.equal(latest.targetCountry, "Singapore");
    assert.equal(latest.targetCity, "Singapore");
    assert.equal(latest.targetServiceArea, "Orchard");
    assert.equal(latest.serviceCategory, "cleaning");
    assert.ok(latest.customerSegments.length >= 1);
    assert.ok(latest.demandFindings);
    assert.ok(latest.competitorProfiles.length >= 1);
    assert.ok(latest.pricingFindings);
    assert.ok(latest.customerPainPoints.length >= 1);
    assert.ok(latest.serviceGaps.length >= 1);
    assert.ok(latest.opportunityFindings.length >= 1);
    assert.ok(latest.marketAttractivenessAssessment);
    assert.ok(Array.isArray(latest.risks));
    assert.ok(Array.isArray(latest.assumptions));
    assert.ok(Array.isArray(latest.unknowns));
    assert.ok(latest.evidenceSources.length >= 1);
    assert.ok(latest.confidenceScore > 0);
    assert.ok(latest.recommendedResearchFollowUps.length >= 1);
    assert.ok(latest.executiveSummary.length > 0);
    assert.equal(latest.metadataVersion, LMRW_METADATA_VERSION);
    assert.equal(latest.reportVersion, LOCAL_MARKET_RESEARCH_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-local-market-research-01");
    assert.equal(latest.consumableByQ703, true);
    assert.equal(latest.neverFinalizeServicePackages, true);
    assert.equal(latest.neverSetFinalPrices, true);
    assert.equal(latest.neverMakeLaunchDecisions, true);
    assert.equal(latest.neverFabricateDemandPricingOrCompetitorData, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.equal(latest.evidenceMode, "fixture");
    assert.equal("finalPriceRecommendation" in latest.pricingFindings, false);
  });

  test("11 submits report through Executive Reporting Runtime when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createLocalMarketResearchWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-lmrw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceLocalMarketResearchReport(sampleInput());
    const submitted = engine.submitReport({
      researchId: produced.latestReport!.researchId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-02"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-lmrw-001");
  });

  test("12 rejects Q7-03 / fabricate / finalize packages / set final prices", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-03" },
      { implementQ703OrLater: true },
      { fabricateDemandPricingOrCompetitorData: true },
      { finalizeServicePackages: true },
      { setFinalPrices: true },
      { makeLaunchDecisions: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceLocalMarketResearchReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("13 exposes Q7-03 consumable contract and cockpit snapshot", async () => {
    const engine = await build();
    engine.produceLocalMarketResearchReport(sampleInput());
    const contract = engine.getQ703ConsumableContract();
    assert.equal(contract.consumableByQ703, true);
    assert.equal(contract.contractVersion, "LMRW-Q703-v1");
    assert.ok(contract.fields.includes("demandFindings"));
    assert.ok(contract.fields.includes("pricingFindings"));
    assert.equal(contract.neverFinalizeServicePackages, true);
    assert.equal(contract.neverSetFinalPrices, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-02");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ703, true);
    assert.equal(cockpit.neverImplementQ703OrLater, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.list().reports.length >= 1);
  });
});
