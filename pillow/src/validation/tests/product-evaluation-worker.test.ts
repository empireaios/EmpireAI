import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PEW_CAPABILITIES,
  PEW_INTEGRATION_TARGETS,
  PEW_METADATA_VERSION,
  PRODUCT_EVALUATION_REPORT_VERSION,
  RECOMMENDATIONS,
  buildProductEvaluationWorkerConfiguration,
  createProductEvaluationWorker,
  resetProductEvaluationWorkerForTesting,
} from "../../product-evaluation-worker/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createProductEvaluationWorker>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createProductEvaluationWorker(bootstrap, config);
  await engine.initialize();
  engine.connectProductEvaluationWorker();
  return engine;
}

const sampleProduct = {
  discoveryId: "pdw-discovery-bamboo-01",
  productId: "prod-bamboo-desk-organizer",
  productName: "Bamboo Desk Organizer",
  category: "home_goods",
  discoverySource: "aggregated",
  marketplace: "amazon",
  supplier: "alibaba",
  searchTrendSignals: ["rising search volume for bamboo organizers"],
  customerDemandSignals: ["customers request compact desk organizers"],
  discoveryReason: "Marketplace + supplier match",
  confidenceScore: 0.78,
  trendDirection: "emerging",
  businessMissionId: "cmf-cbm-commerce-01",
  supportingEvidence: [
    {
      source: "product_discovery_worker",
      claim: "Traceable discovery for Bamboo Desk Organizer",
      kind: "fact",
      relatedTopic: "traceability",
    },
  ],
};

const sampleInput = {
  discoveredProduct: sampleProduct,
  estimatedCost: 8,
  estimatedPrice: 29,
  shippingWeightKg: 0.6,
  competitorCount: 12,
  averageReviewRating: 4.4,
  reviewCount: 180,
  creativeAssetsAvailable: true,
  evidenceSources: [
    {
      source: "pricing_brief",
      claim: "Target retail price $29 with landed cost near $8",
      kind: "fact",
      relatedTopic: "margin",
    },
    {
      source: "operator_estimate",
      claim: "Creative angles likely perform well for home workspace niche",
      kind: "assumption",
      relatedTopic: "creative_potential",
    },
  ],
  validated: true,
};

describe("Q3-03 Product Evaluation Worker", () => {
  beforeEach(resetProductEvaluationWorkerForTesting);

  test("1 locks mandatory product-evaluation-worker boundaries", () => {
    const c = buildProductEvaluationWorkerConfiguration(REPO_ROOT, {
      neverDiscoverProducts: false as never,
      neverSelectSuppliers: false as never,
      neverCreateListings: false as never,
      neverPurchaseInventory: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ304OrLater: false as never,
    });
    assert.equal(c.neverDiscoverProducts, true);
    assert.equal(c.neverSelectSuppliers, true);
    assert.equal(c.neverCreateListings, true);
    assert.equal(c.neverPurchaseInventory, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ304OrLater, true);
  });

  test("2 initializes PILLOW-PEW-001 for Q3-03 with discovery + workforce integrations", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q3-03");
    assert.equal(state.engineVersion, "PILLOW-PEW-001");
    assert.equal(state.configuration.workerId, "wkr-product-evaluation-01");
    for (const target of PEW_INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    for (const recommendation of RECOMMENDATIONS) {
      assert.ok(state.configuration.recommendations.includes(recommendation));
    }
    assert.ok(PEW_CAPABILITIES.includes("score_product_margin"));
  });

  test("3 receives discovered products and scores margin / demand / competition", async () => {
    const engine = await build();
    const received = engine.receiveDiscoveredProducts(sampleInput);
    assert.equal(received.action, "receive_discovered_products");
    const margin = engine.scoreMargin(sampleInput);
    const demand = engine.scoreDemand(sampleInput);
    const competition = engine.scoreCompetition(sampleInput);
    assert.ok(margin.latestEvaluation!.marginScore > 0);
    assert.ok(demand.latestEvaluation!.demandScore > 0);
    assert.ok(competition.latestEvaluation!.competitionScore > 0);
    assert.equal(margin.validation.decision, "pass");
  });

  test("4 scores shipping, risk, reviews, and creative potential", async () => {
    const engine = await build();
    const shipping = engine.scoreShipping(sampleInput);
    const risk = engine.scoreRisk(sampleInput);
    const reviews = engine.scoreReviews(sampleInput);
    const creative = engine.scoreCreativePotential(sampleInput);
    assert.ok(shipping.latestEvaluation!.shippingScore > 0);
    assert.ok(risk.latestEvaluation!.riskScore > 0);
    assert.ok(reviews.latestEvaluation!.reviewScore > 0);
    assert.ok(creative.latestEvaluation!.creativePotentialScore > 0);
  });

  test("5 generates overall score and Proceed/Review/Reject recommendation", async () => {
    const engine = await build();
    const overall = engine.generateOverallScore(sampleInput);
    const recommend = engine.recommendAction(sampleInput);
    assert.ok(overall.latestEvaluation!.overallScore > 0);
    assert.ok(
      ["Proceed", "Review", "Reject"].includes(recommend.latestEvaluation!.recommendation),
    );
    assert.equal(recommend.latestEvaluation!.recommendation, "Proceed");
  });

  test("6 produces machine-readable Product Evaluation Report with required fields", async () => {
    const report = (await build()).produceProductEvaluationReport(sampleInput);
    const latest = report.latestEvaluation!;
    assert.ok(latest.evaluationId.startsWith("pew-eval-"));
    assert.ok(latest.timestamp);
    assert.equal(latest.productId, "prod-bamboo-desk-organizer");
    assert.equal(latest.productName, "Bamboo Desk Organizer");
    assert.equal(latest.category, "home_goods");
    assert.ok(latest.marginScore >= 0);
    assert.ok(latest.demandScore >= 0);
    assert.ok(latest.competitionScore >= 0);
    assert.ok(latest.shippingScore >= 0);
    assert.ok(latest.riskScore >= 0);
    assert.ok(latest.reviewScore >= 0);
    assert.ok(latest.creativePotentialScore >= 0);
    assert.ok(latest.overallScore >= 0);
    assert.ok(latest.recommendation);
    assert.ok(latest.supportingEvidence.length >= 1);
    assert.ok(latest.confidenceScore > 0);
    assert.equal(latest.metadataVersion, PEW_METADATA_VERSION);
    assert.equal(latest.reportVersion, PRODUCT_EVALUATION_REPORT_VERSION);
    assert.equal(latest.discoveryId, "pdw-discovery-bamboo-01");
    assert.ok(latest.facts.length >= 1);
    assert.ok(latest.assumptions.length >= 1);
  });

  test("7 recommends Reject for weak declining products", async () => {
    const report = (await build()).produceProductEvaluationReport({
      discoveredProduct: {
        ...sampleProduct,
        productName: "Declining DVD Player",
        productId: "prod-dvd-player",
        trendDirection: "declining",
        searchTrendSignals: ["declining interest in DVD players"],
        customerDemandSignals: [],
        confidenceScore: 0.3,
      },
      estimatedCost: 40,
      estimatedPrice: 45,
      shippingWeightKg: 3,
      competitorCount: 80,
      averageReviewRating: 2.1,
      reviewCount: 4,
      creativeAssetsAvailable: false,
      validated: true,
    });
    assert.equal(report.latestEvaluation!.recommendation, "Reject");
    assert.ok(report.latestEvaluation!.overallScore < 45);
  });

  test("8 rejects discover / select / listing / purchase / override / Q3-04 boundaries", async () => {
    const engine = await build();
    for (const forbidden of [
      { discoverProducts: true },
      { selectSuppliers: true },
      { createListings: true },
      { purchaseInventory: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ304OrLater: true },
    ] as const) {
      const report = engine.produceProductEvaluationReport({
        ...sampleInput,
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail");
      assert.equal(report.latestEvaluation, null);
    }
  });

  test("9 submits findings through Executive Reporting Runtime integration surface", async () => {
    const submittedIds: string[] = [];
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const engine = createProductEvaluationWorker(bootstrap, {
      dependencies: {
        executiveReportingRuntime: {
          submitWorkerReport: (input) => {
            submittedIds.push(String(input.missionId));
            return { records: [{ reportId: "ert-worker-pew-001" }] };
          },
        },
      },
    });
    await engine.initialize();
    engine.connectProductEvaluationWorker();
    const produced = engine.produceProductEvaluationReport(sampleInput);
    const submitted = engine.submitFindings({
      evaluationId: produced.latestEvaluation!.evaluationId,
      validated: true,
    });
    assert.equal(submitted.action, "submit_findings");
    assert.deepEqual(submittedIds, ["Q3-03"]);
    assert.equal(submitted.latestEvaluation!.submittedToExecutiveReporting, true);
    assert.equal(submitted.latestEvaluation!.executiveReportId, "ert-worker-pew-001");
  });

  test("10 preserves audit history and cockpit boundaries", async () => {
    const engine = await build();
    engine.produceProductEvaluationReport(sampleInput);
    const audit = engine.getAuditTrail();
    assert.ok(audit.length >= 1);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q3-03");
    assert.equal(cockpit.neverDiscoverProducts, true);
    assert.equal(cockpit.neverCreateListings, true);
    assert.ok(cockpit.totalEvaluations >= 1);
  });
});
