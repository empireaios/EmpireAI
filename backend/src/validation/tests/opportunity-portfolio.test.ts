import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createInMemoryPortfolioRepository,
  createOpportunityPortfolioModule,
  scorePortfolioEntry,
} from "../../revenue/opportunity-portfolio/index.js";
import type {
  PortfolioRevenueOpportunityInput,
} from "../../revenue/opportunity-portfolio/index.js";

const WORKSPACE_ID = "ws-m044";

function makeRevenueOpportunity(
  overrides: Partial<PortfolioRevenueOpportunityInput> = {},
): PortfolioRevenueOpportunityInput {
  const productId = overrides.productId ?? `prod-${randomUUID()}`;
  return {
    opportunityId: randomUUID(),
    productId,
    opportunityType: "DROPSHIPPING",
    confidence: 68,
    expectedValue: 62,
    expectedDifficulty: 48,
    reasons: ["Solid demand"],
    risks: ["Moderate competition"],
    ...overrides,
  };
}

describe("Mission 044 Opportunity Portfolio Engine", () => {
  it("ranks portfolio entries by portfolio score", async () => {
    const module = createOpportunityPortfolioModule();
    const high = makeRevenueOpportunity({
      productId: "prod-m044-rank-high",
      expectedValue: 88,
      confidence: 82,
      expectedDifficulty: 30,
    });
    const medium = makeRevenueOpportunity({
      productId: "prod-m044-rank-medium",
      expectedValue: 62,
      confidence: 60,
      expectedDifficulty: 50,
    });
    const low = makeRevenueOpportunity({
      productId: "prod-m044-rank-low",
      expectedValue: 38,
      confidence: 42,
      expectedDifficulty: 65,
      risks: ["Weak demand", "High competition"],
    });

    await module.addPortfolioEntry(WORKSPACE_ID, high);
    await module.addPortfolioEntry(WORKSPACE_ID, medium);
    await module.addPortfolioEntry(WORKSPACE_ID, low);

    const ranked = await module.rankPortfolioEntries(WORKSPACE_ID);
    assert.equal(ranked.length, 3);
    assert.equal(ranked[0]!.productId, high.productId);
    assert.equal(ranked[2]!.productId, low.productId);
    assert.ok(ranked[0]!.portfolioScore > ranked[1]!.portfolioScore);
    assert.ok(ranked[1]!.portfolioScore > ranked[2]!.portfolioScore);

    const directRank = module.rankRevenueOpportunities([low, high, medium]);
    assert.equal(directRank[0]!.revenueOpportunity.productId, high.productId);
  });

  it("assigns watchlist state for moderate opportunities", async () => {
    const module = createOpportunityPortfolioModule();
    const revenueOpportunity = makeRevenueOpportunity({
      productId: "prod-m044-watchlist",
      expectedValue: 52,
      confidence: 55,
      expectedDifficulty: 55,
    });

    const breakdown = scorePortfolioEntry({ revenueOpportunity });
    assert.equal(breakdown.recommendedState, "WATCHLIST");

    const entry = await module.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    assert.equal(entry.state, "WATCHLIST");
    assert.equal(entry.recommendedState, "WATCHLIST");
    assert.equal(entry.capitalPriority, "MEDIUM");
  });

  it("assigns active state for strong opportunities", async () => {
    const module = createOpportunityPortfolioModule();
    const revenueOpportunity = makeRevenueOpportunity({
      productId: "prod-m044-active",
      expectedValue: 74,
      confidence: 68,
      expectedDifficulty: 50,
      opportunityType: "AFFILIATE",
    });

    const breakdown = scorePortfolioEntry({ revenueOpportunity });
    assert.equal(breakdown.recommendedState, "ACTIVE");

    const entry = await module.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    assert.equal(entry.state, "ACTIVE");
    assert.ok(entry.portfolioScore >= 65);
    assert.equal(entry.capitalPriority, "HIGH");
  });

  it("assigns scaling state for top-tier opportunities", async () => {
    const module = createOpportunityPortfolioModule();
    const revenueOpportunity = makeRevenueOpportunity({
      productId: "prod-m044-scaling",
      expectedValue: 90,
      confidence: 82,
      expectedDifficulty: 35,
      reasons: ["Exceptional demand", "Low fulfillment friction"],
      risks: ["Seasonal spike"],
    });

    const breakdown = scorePortfolioEntry({ revenueOpportunity });
    assert.equal(breakdown.recommendedState, "SCALING");

    const entry = await module.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    assert.equal(entry.state, "SCALING");
    assert.ok(entry.portfolioScore >= 80);
    assert.equal(entry.riskLevel, "LOW");
  });

  it("assigns retired state for low-value high-risk opportunities", async () => {
    const module = createOpportunityPortfolioModule();
    const revenueOpportunity = makeRevenueOpportunity({
      productId: "prod-m044-retired",
      expectedValue: 22,
      confidence: 35,
      expectedDifficulty: 78,
      opportunityType: "DIGITAL_PRODUCT",
      risks: ["Weak demand", "Supplier instability", "Low margin", "High competition"],
    });

    const breakdown = scorePortfolioEntry({ revenueOpportunity });
    assert.equal(breakdown.recommendedState, "RETIRED");

    const entry = await module.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    assert.equal(entry.state, "RETIRED");
    assert.equal(entry.riskLevel, "HIGH");
    assert.equal(entry.capitalPriority, "LOW");
  });

  it("persists portfolio entries and portfolio snapshots in the repository", async () => {
    const repository = createInMemoryPortfolioRepository();
    const module = createOpportunityPortfolioModule(repository);
    const revenueOpportunity = makeRevenueOpportunity({
      productId: "prod-m044-persist",
      expectedValue: 72,
      confidence: 68,
      expectedDifficulty: 45,
    });

    const entry = await module.addPortfolioEntry(WORKSPACE_ID, revenueOpportunity);
    const loaded = await module.getPortfolioEntry(WORKSPACE_ID, entry.entryId);
    const byRevenue = await repository.getEntryByRevenueOpportunity(
      WORKSPACE_ID,
      revenueOpportunity.opportunityId,
    );
    const portfolio = await module.getPortfolio(WORKSPACE_ID);

    assert.ok(loaded);
    assert.equal(loaded!.entryId, entry.entryId);
    assert.ok(byRevenue);
    assert.equal(byRevenue!.productId, revenueOpportunity.productId);
    assert.ok(portfolio);
    assert.equal(portfolio!.totalEntries, 1);
    assert.equal(portfolio!.activeCount, 1);

    const listed = await repository.listEntries({
      workspaceId: WORKSPACE_ID,
      minPortfolioScore: 60,
    });
    assert.equal(listed.length, 1);
  });
});
