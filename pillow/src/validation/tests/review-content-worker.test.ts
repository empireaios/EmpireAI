import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  RCW_METADATA_VERSION,
  REVIEW_CONTENT_REPORT_VERSION,
  buildReviewContentWorkerConfiguration,
  createReviewContentWorker,
  resetReviewContentWorkerForTesting,
  type RcwInput,
} from "../../review-content-worker/index.js";

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

function sampleComparison() {
  return {
    reportId: "csw-rpt-0001",
    affiliateProjectId: "afc-prj-travel-gear-01",
    comparisonTopic: "travel_gear",
    productsCompared: [
      {
        productId: "prod-backpack-01",
        name: "TrailBackpack Pro",
        category: "travel_gear",
        programmeId: "prog-travel-gear-01",
        price: 129,
        currency: "USD",
        features: ["waterproof", "laptop_sleeve"],
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
        features: ["carry_on"],
        pros: ["Lightweight"],
        cons: ["Less padding"],
        bestFor: "city travelers",
      },
    ],
    rankingResults: [
      {
        rank: 1,
        productId: "prod-backpack-01",
        productName: "TrailBackpack Pro",
        score: 78,
        bestFor: "weekend hikers",
        rationale: ["opportunity_score=78"],
      },
      {
        rank: 2,
        productId: "prod-duffel-01",
        productName: "CityDuffel Lite",
        score: 70,
        bestFor: "city travelers",
        rationale: ["observed_price=89"],
      },
    ],
  };
}

function sampleInput(overrides: Partial<RcwInput> = {}): RcwInput {
  return {
    affiliateBusinessId: "afc-biz-travel-gear-01",
    affiliateProjectId: "afc-prj-travel-gear-01",
    productId: "prod-backpack-01",
    productOrServiceReviewed: "TrailBackpack Pro",
    fixtureOpportunity: sampleOpportunity(),
    fixtureComparison: sampleComparison(),
    fixtureProduct: {
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
      limitations: ["Not ideal for ultra-light thru-hiking"],
      reviewType: "product",
    },
    fixtureAlternatives: [
      {
        productId: "prod-duffel-01",
        name: "CityDuffel Lite",
        category: "travel_gear",
        price: 89,
        currency: "USD",
        pros: ["Lightweight"],
        cons: ["Less padding"],
        bestFor: "city travelers",
      },
    ],
    pillowCommandConfirmed: true,
    validated: true,
    ...overrides,
  };
}

async function build(config?: Parameters<typeof createReviewContentWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createReviewContentWorker(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q8-04 Review Content Worker", () => {
  beforeEach(resetReviewContentWorkerForTesting);

  test("1 locks mandatory review-content-worker boundaries", () => {
    const c = buildReviewContentWorkerConfiguration(REPO_ROOT, {
      neverFabricateReviewsRatingsOrProductInformation: false as never,
      neverPublishWebsites: false as never,
      neverManipulateRatings: false as never,
      neverReplaceComparisonSiteWorker: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ805OrLater: false as never,
    });
    assert.equal(c.neverFabricateReviewsRatingsOrProductInformation, true);
    assert.equal(c.neverPublishWebsites, true);
    assert.equal(c.neverManipulateRatings, true);
    assert.equal(c.neverReplaceComparisonSiteWorker, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ805OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveAuditHistory, true);
  });

  test("2 initializes PILLOW-RCW-001 for Q8-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q8-04");
    assert.equal(state.engineVersion, "PILLOW-RCW-001");
    assert.equal(state.configuration.workerId, "wkr-review-content-01");
  });

  test("3 consumes Affiliate Opportunity Report", async () => {
    const result = (await build()).consumeAffiliateOpportunityReport(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.match(result.notes.join(" "), /aow-rpt-0001|Consumed/);
  });

  test("4 generates review article", async () => {
    const result = (await build()).generateReviewArticle(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.reviewArticle);
    assert.equal(result.reviewArticle!.productOrServiceReviewed, "TrailBackpack Pro");
    assert.ok(result.reviewArticle!.sections.length >= 1);
    assert.equal(result.reviewArticle!.fabricated, false);
  });

  test("5 generates pros and cons", async () => {
    const result = (await build()).generateProsAndCons(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.prosCons);
    assert.ok(result.prosCons!.pros.includes("Durable shell"));
    assert.ok(result.prosCons!.cons.includes("Premium price"));
    assert.equal(result.prosCons!.fabricated, false);
  });

  test("6 recommends alternatives", async () => {
    const result = (await build()).recommendAlternatives(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.alternatives!.length >= 1);
    assert.equal(result.alternatives![0].productName, "CityDuffel Lite");
    assert.equal(result.alternatives![0].fabricated, false);
  });

  test("7 produces buying recommendation", async () => {
    const result = (await build()).produceBuyingRecommendation(sampleInput());
    assert.equal(result.validation.decision, "pass");
    assert.ok(result.buyingRecommendation);
    assert.ok(
      ["buy", "buy_with_conditions", "consider_alternatives", "insufficient_evidence"].includes(
        result.buyingRecommendation!.verdict,
      ),
    );
    assert.equal(result.buyingRecommendation!.fabricated, false);
  });

  test("8 preserves supporting evidence + version history", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.generateReviewArticle(input);
    const produced = engine.produceReviewContentReport(input);
    const report = produced.latestReport!;
    assert.ok(report.supportingEvidence.length >= 1);
    assert.ok(report.supportingEvidence.some((e) => /opportunity|comparison|fixture/i.test(e)));
    assert.ok(report.versionHistory.length >= 1);
    assert.equal(report.versionHistory[0].version, 1);
    assert.ok(engine.getVersionHistory().length >= 1);
  });

  test("9 full Review Content Report + consumableByQ805", async () => {
    const engine = await build();
    const input = sampleInput();
    engine.consumeAffiliateOpportunityReport(input);
    engine.consumeComparisonSiteReport(input);
    engine.generateReviewArticle(input);
    engine.generateProsAndCons(input);
    engine.recommendAlternatives(input);
    engine.produceBuyingRecommendation(input);
    engine.explainIdealCustomerProfile(input);
    engine.highlightLimitations(input);
    const produced = engine.produceReviewContentReport(input);
    const report = produced.latestReport!;
    assert.ok(report.reportId);
    assert.ok(report.timestamp);
    assert.equal(report.affiliateProjectId, "afc-prj-travel-gear-01");
    assert.equal(report.productOrServiceReviewed, "TrailBackpack Pro");
    assert.ok(report.reviewSummary);
    assert.ok(report.pros.length >= 1);
    assert.ok(report.cons.length >= 1);
    assert.ok(report.alternatives.length >= 1);
    assert.ok(report.buyingRecommendation);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(report.auditStatus);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.metadataVersion, RCW_METADATA_VERSION);
    assert.equal(report.reportVersion, REVIEW_CONTENT_REPORT_VERSION);
    assert.equal(report.consumableByQ805, true);
    assert.equal(report.neverFabricateReviewsRatingsOrProductInformation, true);
    assert.equal(report.neverPublishWebsites, true);
    assert.equal(report.neverImplementQ805OrLater, true);
    assert.ok(report.reviewArticle);
  });

  test("10 ERR submit when injected", async () => {
    const submitted: unknown[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createReviewContentWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (payload) => {
            submitted.push(payload);
            return { records: [{ reportId: "err-rcw-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connect();
    const input = sampleInput();
    engine.produceReviewContentReport(input);
    const result = engine.submitReport(input);
    assert.equal(result.latestReport!.submittedToExecutiveReporting, true);
    assert.equal(result.latestReport!.executiveReportId, "err-rcw-001");
    assert.equal(submitted.length, 1);
  });

  test("11 rejects Q8-05 / fabricate / publish / manipulate / replace-csw / override", async () => {
    const engine = await build();
    for (const input of [
      sampleInput({ implementQ805OrLater: true }),
      sampleInput({ missionId: "Q8-05" }),
      sampleInput({ fabricateReviewsRatingsOrProductInformation: true }),
      sampleInput({ publishWebsites: true }),
      sampleInput({ manipulateRatings: true }),
      sampleInput({ replaceComparisonSiteWorker: true }),
      sampleInput({ overridePillow: true }),
      sampleInput({ bypassGrandKingApproval: true }),
    ]) {
      const result = engine.generateReviewArticle(input);
      assert.equal(result.validation.decision, "fail");
      assert.ok(result.validation.errors.length > 0);
    }
  });

  test("12 Q8-05 consumable contract + cockpit", async () => {
    const engine = await build();
    const contract = engine.getQ805ConsumableContract();
    assert.equal(contract.contractVersion, "RCW-Q805-v1");
    assert.equal(contract.consumableByQ805, true);
    assert.ok(contract.fields.includes("buyingRecommendation"));
    assert.ok(contract.fields.includes("reviewArticle"));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q8-04");
    assert.equal(cockpit.neverFabricateReviewsRatingsOrProductInformation, true);
    assert.equal(cockpit.neverImplementQ805OrLater, true);
    assert.equal(cockpit.consumableByQ805, true);
  });
});
