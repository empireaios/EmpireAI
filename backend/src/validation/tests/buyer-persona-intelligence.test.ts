import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductSignal } from "../../eye/contract/product-signal.js";
import {
  BuyerPersonaMapper,
  buyerSignalFromProductSignal,
  validateBuyerIntentContract,
  validateBuyerPersonaProfile,
  validateBuyerSignal,
} from "../../intelligence/buyer-intelligence/persona-intelligence/index.js";
import { createInMemoryBuyerPersonaRepository } from "../../intelligence/buyer-intelligence/repositories/in-memory-buyer-persona-repository.js";

function buildProductSignal(overrides: Partial<ProductSignal> = {}): ProductSignal {
  return {
    signalId: "sig-m023-1",
    providerId: "amazon-product-intelligence",
    providerName: "Amazon Product Intelligence",
    workspaceId: "ws-m023",
    productTitle: "Portable USB Rechargeable Blender",
    category: "Kitchen & Dining",
    demandIndex: 82,
    competitionIndex: 28,
    marginEstimatePct: 44,
    estimatedSellingPriceCents: 4599,
    monthlyOrdersEstimate: 2100,
    trendDirection: "rising",
    listingCount: 95,
    avgRating: 4.5,
    confidence: 61,
    mock: true,
    fetchedAt: "2026-06-23T12:00:00.000Z",
    normalizedAt: "2026-06-23T12:00:01.000Z",
    observationIds: ["obs-m023-1"],
    subjectKey: "product:amazon:usb-blender",
    ...overrides,
  };
}

describe("Mission 023 Buyer Persona Intelligence Engine", () => {
  const mapper = new BuyerPersonaMapper();

  it("normalizes Eye ProductSignal into BuyerSignal contract", () => {
    const buyerSignal = buyerSignalFromProductSignal(buildProductSignal());
    const validated = validateBuyerSignal(buyerSignal);

    assert.equal(validated.signalId, "sig-m023-1");
    assert.equal(validated.domain, "product");
    assert.ok(validated.keywords.includes("kitchen & dining"));
    assert.ok(validated.platformHints.includes("amazon"));
    assert.ok(validated.urgencyHints.includes("rising_interest"));
  });

  it("maps BuyerSignal to deterministic BuyerPersona profile", () => {
    const signal = buyerSignalFromProductSignal(buildProductSignal());
    const persona = validateBuyerPersonaProfile(mapper.mapSignalToPersona(signal));

    assert.equal(persona.personaId, "persona:moderate:kitchen-dining:25-44");
    assert.equal(persona.name, "Moderate Kitchen & Dining Shopper");
    assert.equal(persona.ageRange, "25-44");
    assert.equal(persona.spendingPower, "moderate");
    assert.equal(persona.urgencyLevel, "high");
    assert.ok(persona.interests.includes("cooking"));
    assert.ok(persona.purchaseTriggers.includes("trending demand"));
    assert.ok(persona.preferredPlatforms.includes("amazon"));
    assert.ok(persona.searchPatterns.some((pattern) => pattern.includes("kitchen")));
  });

  it("derives BuyerIntent contract from mapped persona", () => {
    const signal = buyerSignalFromProductSignal(buildProductSignal());
    const persona = mapper.mapSignalToPersona(signal);
    const intent = validateBuyerIntentContract(mapper.mapSignalToIntent(signal, persona));

    assert.equal(intent.personaId, persona.personaId);
    assert.equal(intent.stage, "purchase");
    assert.equal(intent.urgency, "high");
    assert.equal(intent.sourceSignalId, signal.signalId);
    assert.ok(intent.searchPatterns.length > 0);
  });

  it("maps low-demand falling signals to budget/low urgency personas", () => {
    const signal = buyerSignalFromProductSignal(
      buildProductSignal({
        demandIndex: 22,
        trendDirection: "falling",
        estimatedSellingPriceCents: 1999,
        category: "Electronics",
      }),
    );
    const persona = mapper.mapSignalToPersona(signal);

    assert.equal(persona.spendingPower, "budget");
    assert.equal(persona.urgencyLevel, "low");
    assert.equal(persona.ageRange, "18-34");
    assert.ok(persona.purchaseTriggers.includes("price-sensitive window"));
  });

  it("persists mapped personas through in-memory BuyerPersonaRepository", async () => {
    const repo = createInMemoryBuyerPersonaRepository();
    const signal = buyerSignalFromProductSignal(buildProductSignal());
    const profile = mapper.mapSignalToPersona(signal);
    const createInput = mapper.toWorkspacePersona(profile, signal.workspaceId, signal.observationIds);

    const stored = await repo.create(signal.workspaceId, createInput);
    const bySlug = await repo.getBySlug(signal.workspaceId, createInput.slug);
    const listed = await repo.list({ workspaceId: signal.workspaceId });

    assert.ok(stored.id.length > 0);
    assert.equal(bySlug?.name, profile.name);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.confidence, profile.confidence);
  });

  it("produces identical persona mappings for identical signals", () => {
    const signal = buyerSignalFromProductSignal(buildProductSignal());
    const first = mapper.mapSignalToPersona(signal);
    const second = mapper.mapSignalToPersona(signal);

    assert.deepEqual(first, second);
  });
});
