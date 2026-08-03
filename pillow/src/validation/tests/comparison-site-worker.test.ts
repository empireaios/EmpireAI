import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CSW_METADATA_VERSION,
  COMPARISON_SITE_REPORT_VERSION,
  buildComparisonSiteWorkerConfiguration,
  createComparisonSiteWorker,
  resetComparisonSiteWorkerForTesting,
  type CswInput,
} from "../../comparison-site-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleOpportunity() {
  return {
    reportId: "aow-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    affiliateBusinessId: "afc-biz-travel-gear-01",
    programmeName: "TravelGear Partners",
    productCategory: "travel_gear",
    targetNiche: "travel_gear",
    opportunityScore: 78,
    opportunityRanking: [
      {
        rank: 1,
        programmeId: "prog-travel-gear-01",
        programmeName: "TravelGear Partners",
        productCategory: "travel_gear",
        targetNiche: "travel_gear",
        opportunityScore: 78,
        scoreBasis: ["commission=8", "demand=medium"],
      },
    ],
    products: [
      {
        productId: "prod-backpack-01",
        name: "TrailBackpack Pro",
        category: "travel_gear",
        programmeId: "prog-travel-gear-01",
      },
    ],
  };
}

function sampleProducts() {
  return [
    {
      productId: "prod-backpack-01",
      name: "TrailBackpack Pro",
      category: "travel_gear",
      programmeId: "prog-travel-gear-01",
      price: 129,
      currency: "USD",
      features: ["waterproof", "laptop_sleeve"],
      specs: { capacity_l: "40", weight_kg: "1.2" },
      pros: ["Durable shell", "Comfortable harness"],
      cons: ["Premium price"],
      bestFor: "weekend hikers",
    },
    {
      productId: "prod-duffel-01",
      name: "CityDuffel Lite",
      category: "travel_gear",
      programmeId: "prog-travel-gear-01",
      price: 89,
      currency: "USD",
      features: ["carry_on", "shoe_pocket"],
      specs: { capacity_l: "35", weight_kg: "0.9" },
      pros: ["Lightweight"],
      cons: ["Less padding"],
      bestFor: "city travelers",
    },
  ];
}

function sampleInput(overrides: Partial<CswInput> = {}): CswInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    comparisonTopic: "travel_gear",
    productCategory: "travel_gear",
    niche: "travel_gear",
    topN: 5,
    fixtureOpportunity: sampleOpportunity(),
    fixtureProducts: sampleProducts(),
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createComparisonSiteWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createComparisonSiteWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-03 Comparison Site Worker", () => {
  beforeEach(resetComparisonSiteWorkerForTesting);

  test("1 locks mandatory comparison-site-worker boundaries", () => {
    const c = buildComparisonSiteWorkerConfiguration(REPO_ROOT, {
      neverFabricateRankingsOrProductInformation: false as never,
      neverPublishWebsites: false as never,
      neverManipulateRankingsWithoutEvidence: false as never,
      neverReplaceReviewContentWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ804OrLater: false as never,
    });
    assert.equal(c.neverFabricateRankingsOrProductInformation, true);
    assert.equal(c.neverPublishWebsites, true);
    assert.equal(c.neverManipulateRankingsWithoutEvidence, true);
    assert.equal(c.neverReplaceReviewContentWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ804OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
  });

  test("2 initializes PILLOW-CSW-001 for Q8-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-03");
    assert.equal(state.engineVersion, "PILLOW-CSW-001");
    assert.equal(state.configuration.workerId, "wkr-comparison-site-01");
  });

  test("3 consumes Affiliate Opportunity Report", async () => {
    const result = (await build()).consumeAffiliateOpportunityReport(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.match(result.notes.join(" "), /aow-rpt-0001|Consumed/);
  });

  test("4 generates comparison page", async () => {
    const result = (await build()).generateComparisonPage(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.comparisonPage);
    assert.equal(result.comparisonPage!.pageType, "comparison");
    assert.ok(result.comparisonPage!.productsCompared.includes("TrailBackpack Pro"));
    assert.equal(result.comparisonPage!.fabricated, false);
  });

  test("5 generates ranking page", async () => {
    const result = (await build()).generateRankingPage(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.rankingPage);
    assert.equal(result.rankingPage!.pageType, "ranking");
    assert.ok(result.rankingPage!.rankings.length >= 1);
    assert.equal(result.rankingPage!.rankings[0].fabricated, false);
    assert.ok(result.rankingPage!.methodologyRef);
  });

  test("6 generates buyer guide", async () => {
    const result = (await build()).generateBuyerGuide(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.buyerGuide);
    assert.ok(result.buyerGuide!.buyingFactors.length >= 1);
    assert.ok(result.buyerGuide!.faqs.length >= 1);
    assert.ok(result.buyerGuide!.bestForRecommendations.length >= 1);
    assert.equal(result.buyerGuide!.fabricated, false);
  });

  test("7 generates comparison tables (feature + pricing)", async () => {
    const result = (await build()).generateComparisonTables(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.comparisonTables!.length >= 2);
    assert.ok(result.comparisonTables!.some((t) => /feature/i.test(t.title)));
    assert.ok(result.comparisonTables!.some((t) => /pricing/i.test(t.title)));
    for (const table of result.comparisonTables!) {
      assert.equal(table.fabricated, false);
      assert.equal(table.derivedFromEvidence, true);
    }
  });

  test("8 documents ranking methodology", async () => {
    const result = (await build()).documentMethodology(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.methodologySummary);
    assert.equal(result.methodologySummary!.neverFabricatedRankings, true);
    assert.ok(result.methodologySummary!.factors.length >= 1);
  });

  test("9 full Comparison Site Report + consumableByQ804", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.consumeAffiliateOpportunityReport(input);
    engine.generateComparisonPage(input);
    engine.generateRankingPage(input);
    engine.generateBuyerGuide(input);
    engine.generateComparisonTables(input);
    engine.documentMethodology(input);
    const produced = engine.produceComparisonSiteReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.equal(report.comparisonTopic, "travel_gear");
    assert.ok(report.productsCompared.length >= 2);
    assert.ok(report.rankingResults.length >= 1);
    assert.ok(report.comparisonTables.length >= 2);
    assert.ok(report.buyerGuide);
    assert.ok(report.methodologySummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, CSW_METADATA_VERSION);
    assert.equal(report.reportVersion, COMPARISON_SITE_REPORT_VERSION);
    assert.equal(report.consumableByQ804, true);
    assert.equal(report.neverFabricateRankingsOrProductInformation, true);
    assert.equal(report.neverPublishWebsites, true);
    assert.equal(report.neverImplementQ804OrLater, true);
    assert.ok(report.comparisonPage);
    assert.ok(report.rankingPage);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createComparisonSiteWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-csw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceComparisonSiteReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-csw-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-04 / fabricate / publish / manipulate / replace-review / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ804OrLater: true }),
      sampleInput({ missionId: "Q8-04" }),
      sampleInput({ fabricateRankingsOrProductInformation: true }),
      sampleInput({ publishWebsites: true }),
      sampleInput({ manipulateRankingsWithoutEvidence: true }),
      sampleInput({ replaceReviewContentWorker: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.generateComparisonPage(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-04 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ804ConsumableContract();
    assert.equal(contract.contractVersion, "CSW-Q804-v1");
    assert.equal(contract.consumableByQ804, true);
    assert.ok(contract.fields.includes("rankingResults"));
    assert.ok(contract.fields.includes("buyerGuide"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-03");
    assert.equal(cockpit.neverFabricateRankingsOrProductInformation, true);
    assert.equal(cockpit.neverImplementQ804OrLater, true);
    assert.equal(cockpit.consumableByQ804, true);
  });
});
