import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AOW_METADATA_VERSION,
  AFFILIATE_OPPORTUNITY_REPORT_VERSION,
  buildAffiliateOpportunityWorkerConfiguration,
  createAffiliateOpportunityWorker,
  resetAffiliateOpportunityWorkerForTesting,
  type AowInput,
} from "../../affiliate-opportunity-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleFixtures(): Pick<
  AowInput,
  | "fixtureProgrammes"
  | "fixtureProducts"
  | "fixtureNiches"
  | "fixtureCommissionData"
  | "fixtureDemandSignals"
  | "fixtureCompetition"
> {
  return {
    fixtureProgrammes: [
      {
        programmeId: "prog-travel-gear-01",
        programmeName: "TravelGear Partners",
        network: "ShareASale",
        cookieDays: 30,
        payoutFrequency: "monthly",
      },
    ],
    fixtureProducts: [
      {
        productId: "prod-backpack-01",
        name: "TrailBackpack Pro",
        category: "travel_gear",
        programmeId: "prog-travel-gear-01",
      },
    ],
    fixtureNiches: [
      { nicheId: "niche-travel-gear", name: "travel_gear", region: "SG" },
    ],
    fixtureCommissionData: [
      {
        programmeId: "prog-travel-gear-01",
        commissionPercent: 8,
        cookieDays: 30,
        payoutFrequency: "monthly",
      },
    ],
    fixtureDemandSignals: [
      {
        nicheId: "niche-travel-gear",
        searchVolumeBand: "medium",
        trend: "rising",
        seasonality: "Q4_peak",
      },
    ],
    fixtureCompetition: [
      {
        nicheId: "niche-travel-gear",
        competitorCountBand: "moderate",
        notes: "2 established blogs",
      },
    ],
  };
}

function sampleInput(overrides: Partial<AowInput> = {}): AowInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    niche: "travel_gear",
    region: "SG",
    productCategory: "travel_gear",
    evidenceMode: "fixture",
    pillowCommandConfirmed: true,
    validated: true,
    ...sampleFixtures(),
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createAffiliateOpportunityWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAffiliateOpportunityWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-02 Affiliate Opportunity Worker", () => {
  beforeEach(resetAffiliateOpportunityWorkerForTesting);

  test("1 locks mandatory affiliate-opportunity-worker boundaries", () => {
    const c = buildAffiliateOpportunityWorkerConfiguration(REPO_ROOT, {
      neverFabricateCommissionOrDemandData: false as never,
      neverCreateAffiliateContent: false as never,
      neverPublishWebsites: false as never,
      neverJoinAffiliateProgrammesAutomatically: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ803OrLater: false as never,
    });
    assert.equal(c.neverFabricateCommissionOrDemandData, true);
    assert.equal(c.neverCreateAffiliateContent, true);
    assert.equal(c.neverPublishWebsites, true);
    assert.equal(c.neverJoinAffiliateProgrammesAutomatically, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ803OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveResearchEvidence, true);
    assert.equal(c.preserveAuditHistory, true);
  });

  test("2 initializes PILLOW-AOW-001 for Q8-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-02");
    assert.equal(state.engineVersion, "PILLOW-AOW-001");
    assert.equal(state.configuration.workerId, "wkr-affiliate-opportunity-01");
  });

  test("3 discovers affiliate programmes from fixtures", async () => {
    const result = (await build()).discoverAffiliateProgrammes(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.programmes!.length, 1);
    assert.equal(result.programmes![0].programmeName, "TravelGear Partners");
    assert.equal(result.programmes![0].fabricated, false);
  });

  test("4 identifies products and researches niches", async () => {
    const engine = await build();
    const products = engine.discoverAffiliateProducts(sampleInput());
    const niches = engine.researchProfitableNiches(sampleInput());
    assert.equal(products.products!.length, 1);
    assert.equal(products.products![0].name, "TrailBackpack Pro");
    assert.equal(niches.niches!.length, 1);
    assert.equal(niches.niches![0].name, "travel_gear");
  });

  test("5 analyses commission structures (comparison)", async () => {
    const engine = await build();
    engine.discoverAffiliateProgrammes(sampleInput());
    const result = engine.analyseCommissionStructures(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.equal(result.commissionComparisons!.length, 1);
    assert.equal(result.commissionComparisons![0].commissionPercent, 8);
    assert.equal(result.commissionComparisons![0].cookieDays, 30);
    assert.equal(result.commissionComparisons![0].fabricated, false);
  });

  test("6 estimates demand from fixture signals (unknown when empty)", async () => {
    const engine = await build();
    const withEvidence = engine.estimateMarketDemand(sampleInput());
    assert.equal(withEvidence.demandAssessment!.evidencePresent, true);
    assert.match(withEvidence.demandAssessment!.estimatedDemand, /medium/);
    const empty = engine.estimateMarketDemand({
      affiliateBusinessId: "afc-biz-empty",
      fixtureDemandSignals: [],
      fixtureNiches: [],
    });
    assert.equal(empty.demandAssessment!.estimatedDemand, "unknown");
    assert.equal(empty.demandAssessment!.evidencePresent, false);
    assert.equal(empty.demandAssessment!.fabricated, false);
  });

  test("7 compares and ranks opportunities", async () => {
    const engine = await build();
    engine.discoverAffiliateProgrammes(sampleInput());
    engine.discoverAffiliateProducts(sampleInput());
    engine.researchProfitableNiches(sampleInput());
    engine.analyseCommissionStructures(sampleInput());
    engine.estimateMarketDemand(sampleInput());
    engine.compareCompetingOpportunities(sampleInput());
    const ranked = engine.rankOpportunities(sampleInput());
    assert.ok(ranked.opportunityRanking!.length >= 1);
    assert.equal(ranked.opportunityRanking![0].rank, 1);
    assert.ok(ranked.opportunityRanking![0].opportunityScore != null);
    assert.equal(ranked.opportunityRanking![0].fabricated, false);
  });

  test("8 identifies risks + recommends high-potential", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.discoverAffiliateProgrammes(input);
    engine.discoverAffiliateProducts(input);
    engine.researchProfitableNiches(input);
    engine.analyseCommissionStructures(input);
    engine.estimateMarketDemand(input);
    engine.compareCompetingOpportunities(input);
    engine.rankOpportunities(input);
    const risks = engine.identifyRisks(input);
    const rec = engine.recommendHighPotentialOpportunities(input);
    assert.ok(Array.isArray(risks.risks));
    assert.ok(
      ["recommend", "recommend_with_conditions", "do_not_recommend", "insufficient_evidence"].includes(
        rec.recommendation!,
      ),
    );
  });

  test("9 full Affiliate Opportunity Report + consumableByQ803", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.discoverAffiliateProgrammes(input);
    engine.discoverAffiliateProducts(input);
    engine.researchProfitableNiches(input);
    engine.analyseCommissionStructures(input);
    engine.estimateMarketDemand(input);
    engine.compareCompetingOpportunities(input);
    engine.rankOpportunities(input);
    engine.identifyRisks(input);
    engine.recommendHighPotentialOpportunities(input);
    const produced = engine.produceAffiliateOpportunityReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.equal(report.affiliateBusinessId, "afc-biz-travel-gear-01");
    assert.equal(report.programmeName, "TravelGear Partners");
    assert.equal(report.productCategory, "travel_gear");
    assert.equal(report.targetNiche, "travel_gear");
    assert.ok(report.commissionStructure);
    assert.ok(report.estimatedDemand);
    assert.ok(report.competitionSummary);
    assert.ok(report.opportunityScore != null);
    assert.ok(Array.isArray(report.risks));
    assert.ok(report.recommendation);
    assert.ok(report.auditStatus);
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, AOW_METADATA_VERSION);
    assert.equal(report.reportVersion, AFFILIATE_OPPORTUNITY_REPORT_VERSION);
    assert.equal(report.consumableByQ803, true);
    assert.equal(report.neverFabricateCommissionOrDemandData, true);
    assert.equal(report.neverCreateAffiliateContent, true);
    assert.equal(report.neverImplementQ803OrLater, true);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createAffiliateOpportunityWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-aow-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.discoverAffiliateProgrammes(input);
    engine.analyseCommissionStructures(input);
    engine.estimateMarketDemand(input);
    engine.compareCompetingOpportunities(input);
    engine.rankOpportunities(input);
    engine.produceAffiliateOpportunityReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-aow-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-03 / fabricate commission-demand / create content / publish / join programmes", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ803OrLater: true }),
      sampleInput({ missionId: "Q8-03" }),
      sampleInput({ fabricateCommissionOrDemandData: true }),
      sampleInput({ createAffiliateContent: true }),
      sampleInput({ publishWebsites: true }),
      sampleInput({ joinAffiliateProgrammesAutomatically: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.discoverAffiliateProgrammes(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-03 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ803ConsumableContract();
    assert.equal(contract.contractVersion, "AOW-Q803-v1");
    assert.equal(contract.consumableByQ803, true);
    assert.ok(contract.fields.includes("opportunityScore"));
    assert.ok(contract.fields.includes("opportunityRanking"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-02");
    assert.equal(cockpit.neverFabricateCommissionOrDemandData, true);
    assert.equal(cockpit.neverImplementQ803OrLater, true);
    assert.equal(cockpit.consumableByQ803, true);
  });
});
