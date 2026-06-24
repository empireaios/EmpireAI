import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ProductOpportunity } from "../../intelligence/product-opportunity/models/product-opportunity.js";
import type { SupplierProfile } from "../../intelligence/supplier-intelligence/models/supplier-profile.js";
import {
  createInMemoryMatchingRepository,
  createSupplierOpportunityModule,
  scoreSupplierOpportunityMatch,
} from "../../intelligence/supplier-opportunity-matching/index.js";

const WORKSPACE_ID = "ws-m029";
const TIMESTAMP = "2026-06-23T12:00:00.000Z";

function buildOpportunity(overrides: Partial<ProductOpportunity> = {}): ProductOpportunity {
  return {
    id: "opp-m029-blender",
    workspaceId: WORKSPACE_ID,
    productId: "prod-m029-blender",
    buyerPersonaId: "persona:moderate:kitchen-dining:25-44",
    opportunityScore: 82,
    opportunityTier: "high",
    confidence: 79,
    reasoning: "Portable USB Blender is a high opportunity for kitchen shoppers.",
    strengths: ["buyer product match: strong alignment", "reachability: Amazon channel fit"],
    weaknesses: ["competition in kitchen category"],
    recommendedChannels: ["Amazon", "Google Search", "Pinterest"],
    signals: [],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildTrustedSupplier(overrides: Partial<SupplierProfile> = {}): SupplierProfile {
  return {
    id: "profile-trusted-001",
    workspaceId: WORKSPACE_ID,
    supplierId: "supplier-trusted-001",
    supplierName: "Evergreen Fulfillment Co.",
    country: "United States",
    categories: ["kitchen", "home"],
    fulfillmentScore: 88,
    reliabilityScore: 90,
    communicationScore: 85,
    qualityScore: 87,
    trustScore: 88,
    capability: {
      supportsDropshipping: true,
      supportsBranding: true,
      supportsCustomPackaging: true,
      supportsBulkOrders: true,
    },
    riskProfile: {
      riskLevel: "low",
      disputeRisk: 18,
      shippingRisk: 15,
      qualityRisk: 16,
      fraudRisk: 12,
    },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

function buildRiskySupplier(overrides: Partial<SupplierProfile> = {}): SupplierProfile {
  return {
    id: "profile-risky-002",
    workspaceId: WORKSPACE_ID,
    supplierId: "supplier-risky-002",
    supplierName: "Unverified Trade Hub",
    country: "CN",
    categories: ["electronics"],
    fulfillmentScore: 42,
    reliabilityScore: 38,
    communicationScore: 35,
    qualityScore: 40,
    trustScore: 39,
    capability: {
      supportsDropshipping: true,
      supportsBranding: false,
      supportsCustomPackaging: false,
      supportsBulkOrders: false,
    },
    riskProfile: {
      riskLevel: "high",
      disputeRisk: 68,
      shippingRisk: 62,
      qualityRisk: 65,
      fraudRisk: 70,
    },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

describe("Mission 029 Supplier Opportunity Matching Engine", () => {
  it("scores a high match supplier for a strong kitchen opportunity", () => {
    const match = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity(),
      supplier: buildTrustedSupplier(),
      productCategories: ["kitchen", "portable"],
    });

    assert.equal(match.matchTier, "high");
    assert.ok(match.matchScore >= 75);
    assert.equal(match.recommendedUse, "primary fulfillment partner");
    assert.ok(match.strengths.length > 0);
  });

  it("scores a medium match supplier with partial category overlap", () => {
    const match = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity({ opportunityScore: 58, opportunityTier: "medium" }),
      supplier: buildTrustedSupplier({
        categories: ["fitness", "portable"],
        capability: {
          supportsDropshipping: true,
          supportsBranding: false,
          supportsCustomPackaging: false,
          supportsBulkOrders: true,
        },
      }),
      productCategories: ["fitness"],
    });

    assert.equal(match.matchTier, "medium");
    assert.ok(match.matchScore >= 45 && match.matchScore < 75);
  });

  it("scores a low match supplier for mismatched opportunity", () => {
    const match = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity({ opportunityScore: 35, opportunityTier: "low", confidence: 45 }),
      supplier: buildRiskySupplier(),
      productCategories: ["kitchen"],
    });

    assert.equal(match.matchTier, "low");
    assert.ok(match.matchScore < 45);
    assert.equal(match.recommendedUse, "avoid for this opportunity");
  });

  it("derives confidence from supplier trust, risk, and opportunity quality", () => {
    const strong = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity({ confidence: 88, opportunityScore: 85 }),
      supplier: buildTrustedSupplier(),
    });
    const weak = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity({ confidence: 40, opportunityScore: 30 }),
      supplier: buildRiskySupplier(),
    });

    assert.ok(strong.confidence > weak.confidence);
    assert.ok(strong.signals.some((signal) => signal.signalType === "confidence"));
  });

  it("weights dropshipping and branding capability in match scoring", () => {
    const withCapabilities = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity(),
      supplier: buildTrustedSupplier(),
    });
    const withoutCapabilities = scoreSupplierOpportunityMatch({
      opportunity: buildOpportunity(),
      supplier: buildTrustedSupplier({
        capability: {
          supportsDropshipping: false,
          supportsBranding: false,
          supportsCustomPackaging: false,
          supportsBulkOrders: false,
        },
      }),
    });

    assert.ok(withCapabilities.matchScore > withoutCapabilities.matchScore);
    assert.ok(
      withCapabilities.signals.find((signal) => signal.signalType === "dropshipping_support")!
        .score >
        withoutCapabilities.signals.find((signal) => signal.signalType === "dropshipping_support")!
          .score,
    );
  });

  it("persists supplier opportunity matches via module", async () => {
    const repository = createInMemoryMatchingRepository();
    const module = createSupplierOpportunityModule(repository);
    const opportunity = buildOpportunity();
    const supplier = buildTrustedSupplier();

    const created = await module.matchAndPersist(WORKSPACE_ID, opportunity, supplier, ["kitchen"]);
    const stored = await repository.getByTriple(
      WORKSPACE_ID,
      supplier.supplierId,
      opportunity.productId,
      opportunity.id,
    );
    const listed = await module.listMatches(WORKSPACE_ID, {
      opportunityId: opportunity.id,
      matchTier: "high",
    });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.supplierId, supplier.supplierId);
    assert.equal(stored!.productId, opportunity.productId);
    assert.equal(stored!.opportunityId, opportunity.id);
    assert.equal(listed.length, 1);
  });
});
