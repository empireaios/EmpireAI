import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createCapitalAllocationModule,
  createInMemoryAllocationRepository,
  scoreCapitalAllocation,
} from "../../revenue/capital-allocation-intelligence/index.js";
import type {
  CapitalAllocationEntryInput,
} from "../../revenue/capital-allocation-intelligence/index.js";
import type { PortfolioState } from "../../revenue/opportunity-portfolio/index.js";
import type { RiskLevel } from "../../revenue/opportunity-portfolio/index.js";

const WORKSPACE_ID = "ws-m045";
const TOTAL_CAPITAL = 10_000;

function makeAllocationEntry(
  state: PortfolioState,
  overrides: {
    portfolioScore?: number;
    confidence?: number;
    expectedValue?: number;
    expectedDifficulty?: number;
    riskLevel?: RiskLevel;
    productId?: string;
  } = {},
): CapitalAllocationEntryInput {
  const productId = overrides.productId ?? `prod-${state.toLowerCase()}-${randomUUID()}`;
  const opportunityId = randomUUID();
  const entryId = randomUUID();

  return {
    portfolioEntry: {
      entryId,
      revenueOpportunityId: opportunityId,
      productId,
      state,
      portfolioScore: overrides.portfolioScore ?? 60,
      capitalPriority: "MEDIUM",
      riskLevel: overrides.riskLevel ?? "MEDIUM",
    },
    revenueOpportunity: {
      opportunityId,
      productId,
      confidence: overrides.confidence ?? 60,
      expectedValue: overrides.expectedValue ?? 60,
      expectedDifficulty: overrides.expectedDifficulty ?? 50,
    },
  };
}

function findAllocation(
  allocations: Awaited<ReturnType<typeof scoreCapitalAllocation>>,
  state: PortfolioState,
) {
  return allocations.find((allocation) => allocation.portfolioState === state);
}

describe("Mission 045 Capital Allocation Intelligence Engine", () => {
  it("allocates the largest share to a scaling opportunity", () => {
    const plan = {
      totalCapital: TOTAL_CAPITAL,
      entries: [
        makeAllocationEntry("SCALING", {
          productId: "prod-m045-scaling",
          portfolioScore: 86,
          confidence: 82,
          expectedValue: 90,
          expectedDifficulty: 35,
          riskLevel: "LOW",
        }),
        makeAllocationEntry("ACTIVE", {
          productId: "prod-m045-active-compare",
          portfolioScore: 68,
          confidence: 68,
          expectedValue: 74,
          expectedDifficulty: 50,
          riskLevel: "MEDIUM",
        }),
        makeAllocationEntry("WATCHLIST", {
          productId: "prod-m045-watchlist-compare",
          portfolioScore: 52,
          confidence: 55,
          expectedValue: 52,
          expectedDifficulty: 55,
        }),
        makeAllocationEntry("RETIRED", {
          productId: "prod-m045-retired-compare",
          portfolioScore: 18,
          confidence: 30,
          expectedValue: 20,
          expectedDifficulty: 80,
          riskLevel: "HIGH",
        }),
      ],
    };

    const allocations = scoreCapitalAllocation(plan);
    const scaling = findAllocation(allocations, "SCALING")!;
    const active = findAllocation(allocations, "ACTIVE")!;
    const watchlist = findAllocation(allocations, "WATCHLIST")!;
    const retired = findAllocation(allocations, "RETIRED")!;

    assert.ok(scaling.riskAdjustedAllocation > active.riskAdjustedAllocation);
    assert.ok(active.riskAdjustedAllocation > watchlist.riskAdjustedAllocation);
    assert.equal(retired.allocationPercentage, 0);
    assert.equal(retired.allocationAmount, 0);
    assert.equal(retired.riskAdjustedAllocation, 0);
  });

  it("allocates capital to active portfolio opportunities", () => {
    const entry = makeAllocationEntry("ACTIVE", {
      productId: "prod-m045-active",
      portfolioScore: 70,
      confidence: 68,
      expectedValue: 74,
      expectedDifficulty: 48,
      riskLevel: "MEDIUM",
    });

    const [allocation] = scoreCapitalAllocation({
      totalCapital: TOTAL_CAPITAL,
      entries: [entry],
    });

    assert.equal(allocation!.allocationPercentage, 100);
    assert.equal(allocation!.allocationAmount, TOTAL_CAPITAL);
    assert.ok(allocation!.riskAdjustedAllocation > 0);
    assert.ok(allocation!.confidence >= 60);
    assert.match(allocation!.rationale, /ACTIVE portfolio state/i);
  });

  it("allocates a smaller share to watchlist opportunities", () => {
    const plan = {
      totalCapital: TOTAL_CAPITAL,
      entries: [
        makeAllocationEntry("ACTIVE", {
          productId: "prod-m045-watch-active",
          portfolioScore: 70,
          confidence: 68,
          expectedValue: 74,
          expectedDifficulty: 48,
        }),
        makeAllocationEntry("WATCHLIST", {
          productId: "prod-m045-watchlist",
          portfolioScore: 52,
          confidence: 55,
          expectedValue: 52,
          expectedDifficulty: 55,
        }),
      ],
    };

    const allocations = scoreCapitalAllocation(plan);
    const active = findAllocation(allocations, "ACTIVE")!;
    const watchlist = findAllocation(allocations, "WATCHLIST")!;

    assert.ok(active.allocationPercentage > watchlist.allocationPercentage);
    assert.ok(active.allocationAmount > watchlist.allocationAmount);
    assert.ok(watchlist.allocationPercentage > 0);
  });

  it("allocates zero capital to retired opportunities", () => {
    const plan = {
      totalCapital: TOTAL_CAPITAL,
      entries: [
        makeAllocationEntry("RETIRED", {
          productId: "prod-m045-retired",
          portfolioScore: 15,
          confidence: 28,
          expectedValue: 18,
          expectedDifficulty: 82,
          riskLevel: "HIGH",
        }),
        makeAllocationEntry("ACTIVE", {
          productId: "prod-m045-retired-active",
          portfolioScore: 66,
          confidence: 64,
          expectedValue: 68,
          expectedDifficulty: 52,
        }),
      ],
    };

    const allocations = scoreCapitalAllocation(plan);
    const retired = findAllocation(allocations, "RETIRED")!;
    const active = findAllocation(allocations, "ACTIVE")!;

    assert.equal(retired.allocationPercentage, 0);
    assert.equal(retired.allocationAmount, 0);
    assert.equal(active.allocationPercentage, 100);
  });

  it("applies risk adjustment to allocated capital", () => {
    const lowRisk = makeAllocationEntry("ACTIVE", {
      productId: "prod-m045-risk-low",
      portfolioScore: 68,
      confidence: 68,
      expectedValue: 72,
      expectedDifficulty: 45,
      riskLevel: "LOW",
    });
    const highRisk = makeAllocationEntry("ACTIVE", {
      productId: "prod-m045-risk-high",
      portfolioScore: 68,
      confidence: 68,
      expectedValue: 72,
      expectedDifficulty: 45,
      riskLevel: "HIGH",
    });

    const allocations = scoreCapitalAllocation({
      totalCapital: TOTAL_CAPITAL,
      entries: [lowRisk, highRisk],
    });

    const low = allocations.find((item) => item.productId === lowRisk.revenueOpportunity.productId)!;
    const high = allocations.find((item) => item.productId === highRisk.revenueOpportunity.productId)!;

    assert.equal(low.allocationAmount, high.allocationAmount);
    assert.ok(low.riskAdjustedAllocation > high.riskAdjustedAllocation);
    assert.ok(
      low.signals.some((signal) => signal.signalType === "risk_adjustment"),
    );
  });

  it("persists capital allocations in the repository", async () => {
    const repository = createInMemoryAllocationRepository();
    const module = createCapitalAllocationModule(repository);
    const entry = makeAllocationEntry("SCALING", {
      productId: "prod-m045-persist",
      portfolioScore: 84,
      confidence: 80,
      expectedValue: 88,
      expectedDifficulty: 36,
      riskLevel: "LOW",
    });

    const saved = await module.persistCapitalAllocations(WORKSPACE_ID, {
      totalCapital: TOTAL_CAPITAL,
      entries: [entry],
    });

    assert.equal(saved.length, 1);
    const loaded = await module.getAllocationByOpportunity(
      WORKSPACE_ID,
      entry.revenueOpportunity.opportunityId,
    );
    assert.ok(loaded);
    assert.equal(loaded!.allocationId, saved[0]!.allocationId);
    assert.equal(loaded!.totalCapital, TOTAL_CAPITAL);
    assert.ok(loaded!.riskAdjustedAllocation > 0);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      portfolioState: "SCALING",
    });
    assert.equal(listed.length, 1);
  });
});
