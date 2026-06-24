import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BuyerPersonaProfile } from "../../intelligence/buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../intelligence/product-knowledge-graph/models/product-entity.js";
import {
  createInMemoryOpportunityRepository,
  createOpportunityModule,
  scoreProductOpportunity,
} from "../../intelligence/product-opportunity/index.js";

const WORKSPACE_ID = "ws-m027";
const TIMESTAMP = "2026-06-23T12:00:00.000Z";

function buildPersona(overrides: Partial<BuyerPersonaProfile> = {}): BuyerPersonaProfile {
  return {
    personaId: "persona:moderate:kitchen-dining:25-44",
    name: "Moderate Kitchen & Dining Shopper",
    ageRange: "25-44",
    interests: ["cooking", "meal prep", "home organization"],
    spendingPower: "moderate",
    purchaseTriggers: ["trending demand", "limited competition"],
    urgencyLevel: "high",
    preferredPlatforms: ["amazon", "web"],
    searchPatterns: [
      "portable usb blender",
      "best kitchen & dining",
      "kitchen & dining reviews",
    ],
    confidence: 82,
    ...overrides,
  };
}

function buildProduct(overrides: Partial<ProductEntity> = {}): ProductEntity {
  return {
    id: "prod-m027-blender",
    workspaceId: WORKSPACE_ID,
    canonicalSlug: "portable-usb-blender",
    displayName: "Portable USB Blender",
    description: "Compact rechargeable blender for smoothies",
    categoryId: "cat-kitchen-appliances",
    targetBuyerPersonaIds: ["persona:moderate:kitchen-dining:25-44"],
    supplierRefs: [{ supplierId: "supplier-001", isPrimary: true }],
    sourceObservationIds: ["obs-m027-1"],
    confidence: 78,
    tags: ["kitchen", "portable", "cooking", "meal prep"],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

describe("Mission 027 Product Opportunity Intelligence Engine", () => {
  it("identifies a high opportunity product with strong buyer fit", () => {
    const opportunity = scoreProductOpportunity(buildPersona(), buildProduct());

    assert.equal(opportunity.opportunityTier, "high");
    assert.ok(opportunity.opportunityScore >= 75);
    assert.ok(opportunity.confidence >= 60);
    assert.ok(opportunity.strengths.length > 0);
    assert.ok(opportunity.signals.length === 7);
  });

  it("identifies a medium opportunity product with partial alignment", () => {
    const opportunity = scoreProductOpportunity(
      buildPersona({
        interests: ["fitness", "health", "portable gear"],
        searchPatterns: ["portable fitness blender bottle", "gym accessories"],
        name: "Fitness Enthusiast Shopper",
      }),
      buildProduct({
        targetBuyerPersonaIds: [],
        tags: ["fitness", "portable", "health"],
        displayName: "Portable Fitness Blender Bottle",
        canonicalSlug: "portable-fitness-blender-bottle",
      }),
    );

    assert.equal(opportunity.opportunityTier, "medium");
    assert.ok(opportunity.opportunityScore >= 45 && opportunity.opportunityScore < 75);
  });

  it("identifies a low opportunity product with weak alignment", () => {
    const opportunity = scoreProductOpportunity(
      buildPersona({
        personaId: "persona:budget:electronics:18-34",
        name: "Budget Electronics Shopper",
        ageRange: "18-34",
        interests: ["gadgets", "tech reviews"],
        searchPatterns: ["wireless earbuds"],
        urgencyLevel: "low",
        confidence: 50,
        preferredPlatforms: ["web"],
      }),
      buildProduct({
        id: "prod-m027-serum",
        targetBuyerPersonaIds: [],
        supplierRefs: [],
        tags: ["beauty"],
        displayName: "Vitamin C Serum",
        canonicalSlug: "vitamin-c-serum",
        confidence: 40,
      }),
    );

    assert.equal(opportunity.opportunityTier, "low");
    assert.ok(opportunity.opportunityScore < 45);
  });

  it("recommends channels from reachability intelligence", () => {
    const opportunity = scoreProductOpportunity(
      buildPersona({ preferredPlatforms: ["amazon", "web"] }),
      buildProduct(),
    );

    assert.ok(opportunity.recommendedChannels.length >= 3);
    assert.ok(opportunity.recommendedChannels.includes("Amazon") || opportunity.recommendedChannels.includes("Google Search"));
  });

  it("derives confidence from combined intelligence signals", () => {
    const strong = scoreProductOpportunity(
      buildPersona({ confidence: 90, urgencyLevel: "critical" }),
      buildProduct({ confidence: 88, supplierRefs: [{ supplierId: "s1", isPrimary: true }] }),
    );
    const weak = scoreProductOpportunity(
      buildPersona({ confidence: 40, urgencyLevel: "low", searchPatterns: [], interests: [] }),
      buildProduct({ confidence: 35, supplierRefs: [], targetBuyerPersonaIds: [] }),
    );

    assert.ok(strong.confidence > weak.confidence);
  });

  it("persists product opportunities via opportunity module", async () => {
    const repository = createInMemoryOpportunityRepository();
    const module = createOpportunityModule(repository);
    const persona = buildPersona();
    const product = buildProduct();

    const created = await module.persistOpportunity(WORKSPACE_ID, persona, product);
    const stored = await repository.getByPair(WORKSPACE_ID, product.id, persona.personaId);
    const listed = await module.listOpportunities(WORKSPACE_ID, {
      productId: product.id,
      opportunityTier: "high",
    });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.productId, product.id);
    assert.equal(stored!.buyerPersonaId, persona.personaId);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.opportunityScore, created.opportunityScore);
  });
});
