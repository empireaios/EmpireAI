import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BuyerProductMatch } from "../../intelligence/buyer-product-matching/models/buyer-product-match.js";
import type { ReachabilityProfile } from "../../intelligence/buyer-reachability/models/reachability-profile.js";
import {
  createCommerceLaunchDecisionModule,
  createInMemoryLaunchDecisionRepository,
  scoreCommerceLaunchDecision,
} from "../../intelligence/commerce-launch-decision/index.js";
import type { ProductOpportunity } from "../../intelligence/product-opportunity/models/product-opportunity.js";
import type { SupplierOpportunityMatch } from "../../intelligence/supplier-opportunity-matching/models/supplier-opportunity-match.js";

const WORKSPACE_ID = "ws-m030";
const TIMESTAMP = "2026-06-23T12:00:00.000Z";

function buildOpportunity(overrides: Partial<ProductOpportunity> = {}): ProductOpportunity {
  return {
    id: "opp-m030-blender",
    workspaceId: WORKSPACE_ID,
    productId: "prod-m030-blender",
    buyerPersonaId: "persona:moderate:kitchen-dining:25-44",
    opportunityScore: 82,
    opportunityTier: "high",
    confidence: 80,
    reasoning: "High kitchen opportunity",
    strengths: ["Strong buyer demand", "Good channel fit"],
    weaknesses: ["Moderate category competition"],
    recommendedChannels: ["Amazon", "Google Search", "Pinterest"],
    signals: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildSupplierMatch(overrides: Partial<SupplierOpportunityMatch> = {}): SupplierOpportunityMatch {
  return {
    id: "match-m030-supplier",
    workspaceId: WORKSPACE_ID,
    supplierId: "supplier-trusted-001",
    productId: "prod-m030-blender",
    opportunityId: "opp-m030-blender",
    matchScore: 84,
    matchTier: "high",
    confidence: 82,
    strengths: ["Trusted supplier", "Dropshipping support"],
    weaknesses: [],
    recommendedUse: "primary fulfillment partner",
    signals: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildBuyerMatch(overrides: Partial<BuyerProductMatch> = {}): BuyerProductMatch {
  return {
    id: "match-m030-buyer",
    workspaceId: WORKSPACE_ID,
    buyerPersonaId: "persona:moderate:kitchen-dining:25-44",
    productId: "prod-m030-blender",
    score: 83,
    confidence: 81,
    matchTier: "high",
    reasons: ["Strong persona alignment"],
    matchingSignals: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildReachability(overrides: Partial<ReachabilityProfile> = {}): ReachabilityProfile {
  return {
    id: "reach-m030",
    workspaceId: WORKSPACE_ID,
    buyerPersonaId: "persona:moderate:kitchen-dining:25-44",
    dimensions: {
      organicReach: 72,
      paidReach: 68,
      communityReach: 55,
      marketplaceReach: 78,
      searchReach: 80,
      socialReach: 65,
      aiSearchReach: 60,
      contentDifficulty: 35,
      competitionLevel: 40,
      expectedCost: 250,
    },
    channels: [],
    topChannels: ["Amazon", "Google Search", "Pinterest"],
    confidence: 79,
    signals: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildDecisionInput(overrides: {
  opportunity?: Partial<ProductOpportunity>;
  supplierMatch?: Partial<SupplierOpportunityMatch>;
  buyerMatch?: Partial<BuyerProductMatch>;
  reachability?: Partial<ReachabilityProfile>;
} = {}) {
  return {
    opportunity: buildOpportunity(overrides.opportunity),
    supplierMatch: buildSupplierMatch(overrides.supplierMatch),
    buyerMatch: buildBuyerMatch(overrides.buyerMatch),
    reachability: buildReachability(overrides.reachability),
  };
}

describe("Mission 030 Commerce Launch Decision Engine", () => {
  it("returns LAUNCH for strong combined intelligence signals", () => {
    const result = scoreCommerceLaunchDecision(buildDecisionInput());

    assert.equal(result.decision, "LAUNCH");
    assert.ok(result.launchScore >= 75);
    assert.ok(result.confidence >= 70);
    assert.ok(result.reasons.length > 0);
    assert.ok(result.suggestedTestBudget > 0);
  });

  it("returns WATCH for moderate launch scores", () => {
    const result = scoreCommerceLaunchDecision(
      buildDecisionInput({
        opportunity: { opportunityScore: 58, opportunityTier: "medium", confidence: 62 },
        supplierMatch: { matchScore: 58, matchTier: "medium", confidence: 60 },
        buyerMatch: { score: 55, confidence: 58, matchTier: "medium" },
        reachability: {
          dimensions: {
            organicReach: 55,
            paidReach: 50,
            communityReach: 45,
            marketplaceReach: 52,
            searchReach: 54,
            socialReach: 48,
            aiSearchReach: 46,
            contentDifficulty: 55,
            competitionLevel: 58,
            expectedCost: 180,
          },
          confidence: 58,
        },
      }),
    );

    assert.equal(result.decision, "WATCH");
    assert.ok(result.launchScore >= 45 && result.launchScore < 75);
    assert.ok(result.suggestedTestBudget > 0);
  });

  it("returns REJECT for weak launch scores", () => {
    const result = scoreCommerceLaunchDecision(
      buildDecisionInput({
        opportunity: {
          opportunityScore: 28,
          opportunityTier: "low",
          confidence: 40,
          weaknesses: ["Weak demand", "Poor margin outlook"],
        },
        supplierMatch: {
          matchScore: 30,
          matchTier: "low",
          confidence: 38,
          weaknesses: ["High supplier risk", "No branding support"],
        },
        buyerMatch: { score: 25, confidence: 35, matchTier: "low" },
        reachability: {
          dimensions: {
            organicReach: 30,
            paidReach: 28,
            communityReach: 25,
            marketplaceReach: 32,
            searchReach: 30,
            socialReach: 27,
            aiSearchReach: 26,
            contentDifficulty: 80,
            competitionLevel: 85,
            expectedCost: 120,
          },
          confidence: 35,
        },
      }),
    );

    assert.equal(result.decision, "REJECT");
    assert.ok(result.launchScore < 45);
    assert.equal(result.suggestedTestBudget, 0);
    assert.ok(result.risks.length > 0);
  });

  it("calculates suggested test budget from reachability and decision tier", () => {
    const launch = scoreCommerceLaunchDecision(buildDecisionInput());
    const watch = scoreCommerceLaunchDecision(
      buildDecisionInput({
        opportunity: { opportunityScore: 55, opportunityTier: "medium" },
        supplierMatch: { matchScore: 52, matchTier: "medium" },
        buyerMatch: { score: 50, matchTier: "medium" },
      }),
    );

    assert.ok(launch.suggestedTestBudget > watch.suggestedTestBudget);
    assert.ok(watch.suggestedTestBudget > 0);
  });

  it("explains risks from opportunity, supplier, and reachability inputs", () => {
    const result = scoreCommerceLaunchDecision(
      buildDecisionInput({
        opportunity: { weaknesses: ["Seasonal demand risk"] },
        supplierMatch: { weaknesses: ["Limited bulk capacity"] },
        reachability: {
          dimensions: {
            organicReach: 50,
            paidReach: 48,
            communityReach: 40,
            marketplaceReach: 45,
            searchReach: 47,
            socialReach: 42,
            aiSearchReach: 40,
            contentDifficulty: 70,
            competitionLevel: 72,
            expectedCost: 200,
          },
        },
      }),
    );

    assert.ok(result.risks.some((risk) => risk.includes("Seasonal demand risk")));
    assert.ok(result.risks.some((risk) => risk.includes("Limited bulk capacity")));
    assert.ok(result.risks.some((risk) => risk.toLowerCase().includes("competition")));
  });

  it("persists commerce launch decisions via module", async () => {
    const repository = createInMemoryLaunchDecisionRepository();
    const module = createCommerceLaunchDecisionModule(repository);
    const input = buildDecisionInput();

    const created = await module.decideAndPersist(
      WORKSPACE_ID,
      input.opportunity,
      input.supplierMatch,
      input.buyerMatch,
      input.reachability,
    );
    const stored = await repository.getByContext(
      WORKSPACE_ID,
      input.opportunity.productId,
      input.supplierMatch.supplierId,
      input.opportunity.id,
    );
    const listed = await module.listDecisions(WORKSPACE_ID, { decision: "LAUNCH" });

    assert.ok(stored);
    assert.equal(created.decisionId, stored!.decisionId);
    assert.equal(stored!.productId, input.opportunity.productId);
    assert.equal(stored!.supplierId, input.supplierMatch.supplierId);
    assert.equal(stored!.buyerPersonaId, input.opportunity.buyerPersonaId);
    assert.equal(listed.length, 1);
  });
});
