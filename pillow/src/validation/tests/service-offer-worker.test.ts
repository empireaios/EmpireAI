import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import type { LocalMarketResearchReport } from "../../local-market-research-worker/types.js";
import {
  INTEGRATION_TARGETS,
  PACKAGE_TYPES,
  SERVICE_OFFER_REPORT_VERSION,
  SOW_CAPABILITIES,
  SOW_METADATA_VERSION,
  buildServiceOfferWorkerConfiguration,
  createServiceOfferWorker,
  resetServiceOfferWorkerForTesting,
  type ResearchFixture,
  type ServiceOfferInput,
} from "../../service-offer-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleResearchFixture(): ResearchFixture {
  return {
    researchId: "lmrw-res-fixture-001",
    businessProjectId: "lbfc-prj-cleaning-01",
    targetCountry: "Singapore",
    targetCity: "Singapore",
    targetServiceArea: "Orchard",
    serviceCategory: "cleaning",
    customerSegments: ["busy homeowners", "small offices"],
    demand: {
      demandIndicators: [
        { value: "Recurring residential cleaning searches rising", evidenceClass: "verified" },
        { value: "Office end-of-day cleanouts moderate", evidenceClass: "estimated" },
      ],
      searchPatterns: [{ value: "cleaning near me same day", evidenceClass: "verified" }],
      frequencySignals: [
        { value: "weekly residential / monthly commercial", evidenceClass: "estimated" },
      ],
      urgencySignals: [{ value: "same-day spill cleanup spikes", evidenceClass: "inference" }],
      repeatPotential: [{ value: "high for weekly residential", evidenceClass: "verified" }],
      emergencyPotential: [{ value: "moderate for post-event cleanup", evidenceClass: "estimated" }],
    },
    competitors: [
      {
        name: "Sparkle District Clean",
        serviceArea: "Orchard",
        services: ["residential cleaning", "move-out cleaning"],
        pricingModel: "fixed_package",
        positioning: "premium trusted local",
        evidenceClass: "verified",
      },
      {
        name: "QuickMop Express",
        serviceArea: "Orchard",
        services: ["office cleaning", "residential cleaning"],
        pricingModel: "hourly",
        positioning: "budget speed",
        evidenceClass: "estimated",
      },
    ],
    pricingFindings: {
      currency: "SGD",
      typicalPriceRange: { value: "SGD 80-150 per visit", evidenceClass: "verified" },
      minObservedPrice: { value: "SGD 60", evidenceClass: "estimated" },
      maxObservedPrice: { value: "SGD 220", evidenceClass: "estimated" },
      hourlyRates: [{ value: "SGD 35-55/hr", evidenceClass: "verified" }],
      fixedPackages: [{ value: "2BR flat clean SGD 120", evidenceClass: "verified" }],
      emergencySurcharges: [{ value: "+30% after 9pm", evidenceClass: "inference" }],
      recurringPricing: [{ value: "10% weekly discount", evidenceClass: "estimated" }],
      refundGuaranteePractices: [{ value: "re-clean within 24h", evidenceClass: "estimated" }],
    },
    painPoints: [
      {
        description: "Hard to book reliable same-week cleaners",
        affectedSegment: "busy homeowners",
      },
    ],
    gaps: [
      {
        description: "Few eco-certified cleaning packages in Orchard",
        unmetNeed: "eco_friendly_recurring_clean",
      },
    ],
    opportunities: [
      {
        description: "Eco recurring residential cleaning for Orchard apartments",
        targetCustomer: "busy homeowners",
        pricingIndication: "SGD 100-160 recurring",
      },
    ],
    risks: ["review_density_may_lag_new_entrants"],
    assumptions: ["fixture mirrors near-term Orchard conditions"],
    unknowns: ["licensing_requirements"],
  };
}

function sampleMarketResearchReport(): LocalMarketResearchReport {
  const fixture = sampleResearchFixture();
  return {
    researchId: fixture.researchId!,
    timestamp: "2026-08-02T00:00:00.000Z",
    businessProjectId: fixture.businessProjectId!,
    targetCountry: fixture.targetCountry!,
    targetCity: fixture.targetCity!,
    targetServiceArea: fixture.targetServiceArea!,
    serviceCategory: fixture.serviceCategory!,
    customerSegments: [...fixture.customerSegments!],
    demandFindings: {
      demandIndicators: fixture.demand!.demandIndicators!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "verified",
      })),
      searchPatterns: fixture.demand!.searchPatterns!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "verified",
      })),
      frequencySignals: fixture.demand!.frequencySignals!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "estimated",
      })),
      urgencySignals: fixture.demand!.urgencySignals!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "inference",
      })),
      seasonalPatterns: [{ value: "pre-holiday deep cleans", evidenceClass: "estimated" }],
      residentialVsCommercial: [
        { value: "residential-dominant with commercial pockets", evidenceClass: "verified" },
      ],
      segmentDifferences: [
        {
          value: "homeowners prioritize trust; offices prioritize scheduling",
          evidenceClass: "inference",
        },
      ],
      geographicConcentration: [
        { value: "demand denser in CBD fringe apartments", evidenceClass: "estimated" },
      ],
      repeatPotential: fixture.demand!.repeatPotential!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "verified",
      })),
      emergencyPotential: fixture.demand!.emergencyPotential!.map((v) => ({
        value: v.value,
        evidenceClass: v.evidenceClass as "estimated",
      })),
    },
    competitorProfiles: (fixture.competitors ?? []).map((c, i) => ({
      competitorId: `lmrw-cmp-${String(i + 1).padStart(3, "0")}`,
      name: c.name,
      serviceArea: c.serviceArea ?? "Orchard",
      services: [...(c.services ?? [])],
      pricingModel: c.pricingModel ?? "unknown",
      positioning: c.positioning ?? "unknown",
      availability: "weekday_evenings",
      bookingMethod: "whatsapp",
      channels: ["google_maps"],
      ratings: "4.5/5",
      strengths: ["local_reviews"],
      weaknesses: ["limited_weekend_slots"],
      gaps: [],
      evidenceSource: "fixture_directory",
      researchTimestamp: "2026-08-02T00:00:00.000Z",
      evidenceClass: (c.evidenceClass ?? "estimated") as "verified",
    })),
    pricingFindings: {
      typicalPriceRange: {
        value: fixture.pricingFindings!.typicalPriceRange!.value,
        evidenceClass: "verified",
      },
      minObservedPrice: {
        value: fixture.pricingFindings!.minObservedPrice!.value,
        evidenceClass: "estimated",
      },
      maxObservedPrice: {
        value: fixture.pricingFindings!.maxObservedPrice!.value,
        evidenceClass: "estimated",
      },
      callOutFees: [{ value: "SGD 20-40", evidenceClass: "estimated" }],
      hourlyRates: fixture.pricingFindings!.hourlyRates!.map((v) => ({
        value: v.value,
        evidenceClass: "verified" as const,
      })),
      fixedPackages: fixture.pricingFindings!.fixedPackages!.map((v) => ({
        value: v.value,
        evidenceClass: "verified" as const,
      })),
      emergencySurcharges: fixture.pricingFindings!.emergencySurcharges!.map((v) => ({
        value: v.value,
        evidenceClass: "inference" as const,
      })),
      materialFees: [{ value: "supplies usually included", evidenceClass: "estimated" }],
      transportFees: [{ value: "rarely itemized within Orchard", evidenceClass: "unknown" }],
      inspectionFees: [{ value: "not commonly charged", evidenceClass: "inference" }],
      recurringPricing: fixture.pricingFindings!.recurringPricing!.map((v) => ({
        value: v.value,
        evidenceClass: "estimated" as const,
      })),
      promotions: [{ value: "first-visit 15% off", evidenceClass: "verified" }],
      refundGuaranteePractices: fixture.pricingFindings!.refundGuaranteePractices!.map((v) => ({
        value: v.value,
        evidenceClass: "estimated" as const,
      })),
      currency: "SGD",
      taxInclusionStatus: {
        value: "prices typically include GST ambiguity",
        evidenceClass: "unknown",
      },
    },
    customerPainPoints: [
      {
        painPointId: "lmrw-res-pain-001",
        description: "Hard to book reliable same-week cleaners",
        affectedSegment: "busy homeowners",
        severity: "high",
        evidenceClass: "verified",
        supportingEvidence: ["fixture_reviews_cluster"],
      },
    ],
    serviceGaps: [
      {
        gapId: "lmrw-res-gap-001",
        description: "Few eco-certified cleaning packages in Orchard",
        geographicArea: "Orchard",
        unmetNeed: "eco_friendly_recurring_clean",
        evidenceClass: "estimated",
        supportingEvidence: ["fixture_competitor_gap_scan"],
      },
    ],
    opportunityFindings: [
      {
        opportunityId: "lmrw-opp-001",
        description: "Eco recurring residential cleaning for Orchard apartments",
        supportingEvidence: ["lmrw-res-gap-001"],
        targetCustomer: "busy homeowners",
        geographicArea: "Orchard",
        demandIndication: "moderate_to_high",
        competitionLevel: "moderate",
        pricingIndication: "SGD 100-160 recurring",
        operationalConsiderations: ["supply_eco_consumables"],
        risks: ["price_sensitivity"],
        confidenceLevel: 0.62,
        evidenceClass: "inference",
      },
    ],
    marketAttractivenessAssessment: {
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
        explanation: "Balanced demand vs competition",
        evidenceRefs: ["demand", "competitors", "pricing"],
      },
    },
    risks: [...(fixture.risks ?? [])],
    assumptions: [...(fixture.assumptions ?? [])],
    unknowns: [...(fixture.unknowns ?? [])],
    evidenceSources: [
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
    confidenceScore: 0.64,
    recommendedResearchFollowUps: ["Hand off to Q7-03 Service Offer Worker"],
    executiveSummary: "Structural local market research for cleaning in Orchard.",
    metadataVersion: "LMRW-001-v1",
    reportVersion: "LMRW-RPT-v1",
    workerId: "wkr-local-market-research-01",
    submittedToExecutiveReporting: false,
    executiveReportId: null,
    traceabilityRefs: ["q7-02:local_market_research:lmrw-res-fixture-001"],
    evidenceMode: "fixture",
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

function sampleInput(overrides: Partial<ServiceOfferInput> = {}): ServiceOfferInput {
  return {
    businessProjectId: "lbfc-prj-cleaning-01",
    serviceCategory: "cleaning",
    targetCountry: "Singapore",
    targetCity: "Singapore",
    targetServiceArea: "Orchard",
    customerSegments: ["busy homeowners", "small offices"],
    currency: "SGD",
    packageTypes: ["basic", "premium", "recurring", "emergency"],
    grandKingInstructions: "Define offers only; no booking or launch.",
    pillowCommandConfirmed: true,
    validated: true,
    fixtureMarketResearch: sampleResearchFixture(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createServiceOfferWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createServiceOfferWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q7-03 Service Offer Worker", () => {
  beforeEach(resetServiceOfferWorkerForTesting);

  test("1 locks mandatory service-offer-worker boundaries", () => {
    const c = buildServiceOfferWorkerConfiguration(REPO_ROOT, {
      neverBuildBookingSystems: false as never,
      neverBuildCrm: false as never,
      neverExecuteCustomerJobs: false as never,
      neverLaunchBusiness: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverFabricatePricingEvidence: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ704OrLater: false as never,
    });
    assert.equal(c.neverBuildBookingSystems, true);
    assert.equal(c.neverBuildCrm, true);
    assert.equal(c.neverExecuteCustomerJobs, true);
    assert.equal(c.neverLaunchBusiness, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverFabricatePricingEvidence, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ704OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-SOW-001 for Q7-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q7-03");
    assert.equal(state.engineVersion, "PILLOW-SOW-001");
    assert.equal(state.configuration.workerId, "wkr-service-offer-01");
    assert.equal(state.configuration.factory, "local-business-factory");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(SOW_CAPABILITIES.includes("consume_market_research"));
    for (const pkg of ["basic", "premium", "enterprise", "optional_addon", "emergency", "recurring", "unknown"]) {
      assert.ok((PACKAGE_TYPES as readonly string[]).includes(pkg));
    }
  });

  test("3 consumes market research from fixture and report", async () => {
    const engine = await build();
    const fromFixture = engine.consumeMarketResearch(sampleInput());
    assert.equal(fromFixture.action, "consume_market_research");
    assert.notEqual(fromFixture.validation.decision, "fail");
    assert.ok(fromFixture.latestSession);
    assert.equal(fromFixture.latestSession!.researchSource, "fixtureMarketResearch");
    assert.equal(fromFixture.latestSession!.sourceResearchId, "lmrw-res-fixture-001");
    assert.equal(fromFixture.latestSession!.pricingEvidenceAvailable, true);

    const fromReport = engine.consumeMarketResearch({
      validated: true,
      marketResearchReport: sampleMarketResearchReport(),
    });
    assert.equal(fromReport.latestSession!.researchSource, "marketResearchReport");
    assert.equal(fromReport.latestSession!.sourceResearchId, "lmrw-res-fixture-001");

    const viaId = await build({
      dependencies: {
        localMarketResearchWorker: {
          getReports: () => [sampleMarketResearchReport()],
        },
      },
    });
    const consumed = viaId.consumeMarketResearch({
      researchId: "lmrw-res-fixture-001",
      validated: true,
    });
    assert.equal(consumed.latestSession!.researchSource, "researchId");
    assert.equal(consumed.validation.decision, "pass");
  });

  test("4 defines service catalogue from research", async () => {
    const report = (await build()).defineServiceCatalogue(sampleInput());
    assert.equal(report.action, "define_service_catalogue");
    assert.ok(report.latestSession!.serviceCatalogue.length >= 1);
    assert.ok(report.latestSession!.serviceCatalogue[0]!.serviceId.startsWith("sow-svc-"));
    assert.ok(
      report.latestSession!.serviceCatalogue.some((s) =>
        s.name.toLowerCase().includes("cleaning"),
      ),
    );
  });

  test("5 creates packages (basic/premium/recurring/emergency)", async () => {
    const report = (await build()).defineServicePackages(sampleInput());
    const packages = report.latestSession!.servicePackages;
    assert.ok(packages.length >= 2);
    const types = new Set(packages.map((p) => p.packageType));
    assert.ok(types.has("basic"));
    assert.ok(types.has("premium"));
    assert.ok(packages.every((p) => p.packageId.startsWith("sow-pkg-")));
    assert.ok(packages.every((p) => p.name && p.targetCustomer && p.pricingModel));
    assert.ok(packages.every((p) => Array.isArray(p.inclusions) && Array.isArray(p.exclusions)));
  });

  test("6 pricing recommendations reference Q7-02 research", async () => {
    const report = (await build()).recommendPricingStructure(sampleInput());
    const pricing = report.latestSession!.pricingRecommendations;
    assert.ok(pricing.length >= 1);
    for (const rec of pricing) {
      assert.equal(rec.referencesQ702PricingFindings, true);
      assert.equal(rec.currency, "SGD");
      assert.ok(rec.researchTypicalRange?.includes("80-150"));
      assert.ok(rec.researchMinObserved);
      assert.ok(rec.researchMaxObserved);
      assert.ok(rec.sourceResearchId);
      assert.notEqual(rec.evidenceClass, "unknown");
    }
  });

  test("7 defines guarantees", async () => {
    const report = (await build()).defineGuarantees(sampleInput());
    const guarantees = report.latestSession!.guarantees;
    assert.ok(guarantees.length >= 1);
    assert.ok(guarantees[0]!.guaranteeId.startsWith("sow-gua-"));
    assert.ok(guarantees.some((g) => g.supported && (g.refundConditions || g.reworkConditions)));
  });

  test("8 defines fulfilment requirements", async () => {
    const report = (await build()).defineFulfilmentRequirements(sampleInput());
    const fulfilment = report.latestSession!.fulfilmentRequirements;
    assert.ok(fulfilment.length >= 1);
    assert.ok(fulfilment[0]!.fulfilmentId.startsWith("sow-ful-"));
    assert.ok(fulfilment[0]!.skills.length >= 1);
    assert.ok(fulfilment[0]!.equipment.length >= 1);
    assert.ok(fulfilment[0]!.completionCriteria.length >= 1);
  });

  test("9 produces full Service Offer Report with required fields and consumableByQ704", async () => {
    const report = (await build()).produceServiceOfferReport(sampleInput());
    const latest = report.latestReport!;
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(latest.reportId.startsWith("sow-rpt-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.businessProjectId, "lbfc-prj-cleaning-01");
    assert.ok(latest.serviceCatalogue.length >= 1);
    assert.ok(latest.servicePackages.length >= 1);
    assert.ok(latest.pricingRecommendations.length >= 1);
    assert.ok(latest.packageInclusions.length >= 1);
    assert.ok(latest.packageExclusions.length >= 1);
    assert.ok(latest.guarantees.length >= 1);
    assert.ok(latest.fulfilmentRequirements.length >= 1);
    assert.ok(Array.isArray(latest.operationalAssumptions));
    assert.ok(Array.isArray(latest.risks));
    assert.ok(Array.isArray(latest.outstandingQuestions));
    assert.ok(latest.confidenceScore > 0);
    assert.ok(latest.executiveSummary.length > 0);
    assert.equal(latest.metadataVersion, SOW_METADATA_VERSION);
    assert.equal(latest.reportVersion, SERVICE_OFFER_REPORT_VERSION);
    assert.equal(latest.workerId, "wkr-service-offer-01");
    assert.equal(latest.sourceResearchId, "lmrw-res-fixture-001");
    assert.ok(latest.evidenceAssumptionNotes.length >= 1);
    assert.equal(latest.consumableByQ704, true);
    assert.equal(latest.neverBuildBookingSystems, true);
    assert.equal(latest.neverBuildCrm, true);
    assert.equal(latest.neverExecuteCustomerJobs, true);
    assert.equal(latest.neverLaunchBusiness, true);
    assert.equal(latest.neverFabricatePricingEvidence, true);
    assert.equal(latest.neverImplementQ704OrLater, true);
    assert.ok(latest.traceabilityRefs.length >= 1);
    assert.ok(latest.pricingRecommendations.every((p) => p.referencesQ702PricingFindings));
  });

  test("10 submits report through Executive Reporting Runtime when injected", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createServiceOfferWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-sow-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const produced = engine.produceServiceOfferReport(sampleInput());
    const submitted = engine.submitReport({
      reportId: produced.latestReport!.reportId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_report");
    assert.deepEqual(submittedIds, ["Q7-03"]);
    assert.equal(submitted.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestReport!.executiveReportId, "ert-worker-sow-001");
  });

  test("11 rejects Q7-04 / fabricate pricing / build booking / launch", async () => {
    const engine = await build();
    for (const forbidden of [
      { missionId: "Q7-04" },
      { implementQ704OrLater: true },
      { fabricatePricingEvidence: true },
      { buildBookingSystems: true },
      { buildCrm: true },
      { launchBusiness: true },
      { executeCustomerJobs: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { bypassGrandKingApproval: true },
    ] as const) {
      const report = engine.produceServiceOfferReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestReport, null);
    }
  });

  test("12 exposes Q7-04 consumable contract and cockpit snapshot", async () => {
    const engine = await build();
    engine.produceServiceOfferReport(sampleInput());
    const contract = engine.getQ704ConsumableContract();
    assert.equal(contract.consumableByQ704, true);
    assert.equal(contract.contractVersion, "SOW-Q704-v1");
    assert.ok(contract.fields.includes("servicePackages"));
    assert.ok(contract.fields.includes("pricingRecommendations"));
    assert.equal(contract.neverBuildBookingSystems, true);
    assert.equal(contract.neverFabricatePricingEvidence, true);

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q7-03");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.consumableByQ704, true);
    assert.equal(cockpit.neverImplementQ704OrLater, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.action, "diagnostics");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.list().reports.length >= 1);
  });
});
