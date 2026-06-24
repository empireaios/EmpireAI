import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BuyerPersonaProfile } from "../../intelligence/buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import type { ProductEntity } from "../../intelligence/product-knowledge-graph/models/product-entity.js";
import {
  createInMemoryMatchingRepository,
  createMatchingModule,
  resolveMatchTier,
  scoreBuyerProductMatch,
} from "../../intelligence/buyer-product-matching/index.js";

const WORKSPACE_ID = "ws-m025";
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
    id: "prod-m025-blender",
    workspaceId: WORKSPACE_ID,
    canonicalSlug: "portable-usb-blender",
    displayName: "Portable USB Blender",
    description: "Compact rechargeable blender for smoothies",
    categoryId: "cat-kitchen-appliances",
    targetBuyerPersonaIds: ["persona:moderate:kitchen-dining:25-44"],
    supplierRefs: [{ supplierId: "supplier-001", isPrimary: true }],
    sourceObservationIds: ["obs-m025-1"],
    confidence: 78,
    tags: ["kitchen", "portable", "cooking", "meal prep"],
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

describe("Mission 025 Buyer Product Matching Engine", () => {
  it("scores a high match when persona and product align strongly", () => {
    const breakdown = scoreBuyerProductMatch(buildPersona(), buildProduct());

    assert.equal(breakdown.matchTier, "high");
    assert.ok(breakdown.score >= 75);
    assert.ok(breakdown.confidence >= 60);
    assert.ok(breakdown.matchingSignals.some((signal) => signal.signalType === "category_alignment"));
    assert.ok(breakdown.reasons.length > 0);
  });

  it("scores a medium match for partial alignment", () => {
    const breakdown = scoreBuyerProductMatch(
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

    assert.equal(breakdown.matchTier, "medium");
    assert.ok(breakdown.score >= 45 && breakdown.score < 75);
  });

  it("scores a low match for weak overlap", () => {
    const breakdown = scoreBuyerProductMatch(
      buildPersona({
        interests: ["organization"],
        searchPatterns: ["desk organizer tray"],
        name: "Home Office Shopper",
      }),
      buildProduct({
        targetBuyerPersonaIds: [],
        tags: ["kitchen"],
        displayName: "Kitchen Organizer Tray",
        canonicalSlug: "kitchen-organizer-tray",
      }),
    );

    assert.equal(breakdown.matchTier, "low");
    assert.ok(breakdown.score >= 20 && breakdown.score < 45);
  });

  it("scores no match for unrelated persona and product", () => {
    const breakdown = scoreBuyerProductMatch(
      buildPersona({
        personaId: "persona:budget:electronics:18-34",
        name: "Budget Electronics Shopper",
        ageRange: "18-34",
        interests: ["gadgets", "tech reviews"],
        searchPatterns: ["wireless earbuds", "best electronics"],
        confidence: 55,
      }),
      buildProduct({
        id: "prod-m025-skincare",
        targetBuyerPersonaIds: [],
        tags: ["beauty", "skincare"],
        displayName: "Vitamin C Serum",
        canonicalSlug: "vitamin-c-serum",
        categoryId: "cat-beauty",
      }),
    );

    assert.equal(breakdown.matchTier, "none");
    assert.ok(breakdown.score < 20);
    assert.equal(resolveMatchTier(breakdown.score), "none");
  });

  it("derives confidence from score and source persona/product confidence", () => {
    const strong = scoreBuyerProductMatch(
      buildPersona({ confidence: 90 }),
      buildProduct({ confidence: 88 }),
    );
    const weak = scoreBuyerProductMatch(
      buildPersona({ confidence: 40 }),
      buildProduct({ confidence: 35, targetBuyerPersonaIds: [], tags: ["misc"] }),
    );

    assert.ok(strong.confidence > weak.confidence);
    assert.ok(strong.matchingSignals.length === 5);
  });

  it("persists matches in repository via matching module", async () => {
    const repository = createInMemoryMatchingRepository();
    const module = createMatchingModule(repository);
    const persona = buildPersona();
    const product = buildProduct();

    const created = await module.matchAndPersist(WORKSPACE_ID, persona, product);
    const stored = await repository.getByPair(
      WORKSPACE_ID,
      persona.personaId,
      product.id,
    );
    const listed = await module.listMatches(WORKSPACE_ID, {
      buyerPersonaId: persona.personaId,
      matchTier: "high",
    });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.buyerPersonaId, persona.personaId);
    assert.equal(stored!.productId, product.id);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.score, created.score);
  });
});
