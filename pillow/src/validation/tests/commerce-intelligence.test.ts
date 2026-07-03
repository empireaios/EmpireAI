import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { detectContextTask } from "../../context/intent.js";
import { runContextBuild } from "../../context/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import {
  createCommerceIntelligenceEngine,
  discoverProducts,
  rankSuppliers,
  rankWinningProducts,
  analyzeMarkets,
  PRODUCT_CATALOG,
  SUPPLIER_CATALOG,
  MARKET_CATALOG,
  getQualityThreshold,
} from "../../commerce-intelligence/index.js";
import {
  startPillow,
  requirePillowCommerceIntelligence,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("Phase 7 Commerce Intelligence (PILLOW-CI-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Commerce Intelligence initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const commerce = requirePillowCommerceIntelligence();
    const state = commerce.getState();
    assert.equal(state.intelligenceVersion, "PILLOW-CI-001");
    assert.equal(state.status, "ready");
    assert.equal(state.qualityThreshold, 72);
    assert.ok(state.catalogProducts >= 8);
  });

  test("Product discovery evaluates catalog with quality tiers", () => {
    const evaluations = discoverProducts(PRODUCT_CATALOG);
    assert.equal(evaluations.length, PRODUCT_CATALOG.length);
    const recommended = evaluations.filter((e) => e.qualityTier === "recommended");
    assert.ok(recommended.length >= 3);
    assert.ok(evaluations.every((e) => e.overallScore >= 0 && e.overallScore <= 100));
  });

  test("Winning products exceed quality threshold", () => {
    const evaluations = discoverProducts(PRODUCT_CATALOG);
    const supplierRankings = rankSuppliers(SUPPLIER_CATALOG);
    const marketAnalyses = analyzeMarkets(MARKET_CATALOG);
    const winners = rankWinningProducts({
      evaluations,
      supplierRankings,
      marketAnalyses,
    });

    assert.ok(winners.length >= 2);
    assert.ok(getQualityThreshold() === 72);
    assert.ok(winners.every((w) => w.compositeScore >= 72));

    const names = winners.map((w) => w.product.name);
    assert.ok(names.some((n) => /Pet Grooming Glove/i.test(n)));
    assert.ok(names.some((n) => /Resistance Bands/i.test(n)));
  });

  test("Supplier rankings identify preferred suppliers", () => {
    const rankings = rankSuppliers(SUPPLIER_CATALOG);
    assert.equal(rankings.length, SUPPLIER_CATALOG.length);
    assert.ok(rankings[0]!.compositeScore >= rankings[rankings.length - 1]!.compositeScore);
    assert.ok(rankings.some((r) => r.preferred));
  });

  test("Executive report includes launch plans and actions", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const commerce = createCommerceIntelligenceEngine(bootstrap, intelligence);
    await commerce.initialize();

    const report = commerce.analyzeCommerce();
    assert.equal(report.version, "PILLOW-CI-001");
    assert.ok(report.recommendedProducts.length >= 2);
    assert.ok(report.supplierRankings.length >= 1);
    assert.ok(report.marketOpportunities.length >= 1);
    assert.ok(report.launchPlans.length >= 1);
    assert.ok(report.recommendedActions.length >= 2);
    assert.match(report.executiveBrief, /Commerce Intelligence/i);
    assert.ok(commerce.getIntelligenceSources().length >= 5);
  });

  test("Context builder attaches commerceIntelligenceBrief", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const commerce = createCommerceIntelligenceEngine(bootstrap, intelligence);
    await commerce.initialize();

    const task = detectContextTask("What products should we launch?");
    assert.equal(task, "commerce_intelligence");

    const context = await runContextBuild(
      bootstrap,
      intelligence,
      { userMessage: "What products should we launch?" },
      {},
      undefined,
      undefined,
      undefined,
      undefined,
      commerce,
    );

    assert.ok(context.commerceIntelligenceBrief);
    assert.match(context.commerceIntelligenceBrief!, /PILLOW-CI-001/i);
  });
});
