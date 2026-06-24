import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BuyerPersonaProfile } from "../../intelligence/buyer-intelligence/persona-intelligence/contracts/buyer-persona-profile.js";
import {
  createInMemoryReachabilityRepository,
  createReachabilityModule,
  defaultReachabilityMapper,
  scoreBuyerReachability,
} from "../../intelligence/buyer-reachability/index.js";

const WORKSPACE_ID = "ws-m026";

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

describe("Mission 026 Buyer Reachability Intelligence Engine", () => {
  const mapper = defaultReachabilityMapper;

  it("maps buyer persona to reachability profile", () => {
    const persona = buildPersona();
    const profileInput = mapper.mapPersonaToProfileInput(persona);

    assert.equal(profileInput.buyerPersonaId, persona.personaId);
    assert.equal(profileInput.channels.length, 10);
    assert.ok(profileInput.topChannels.length >= 3);
    assert.ok(profileInput.dimensions.organicReach >= 0);
    assert.ok(profileInput.dimensions.paidReach >= 0);
    assert.ok(profileInput.signals.length === 6);
  });

  it("scores organic reach from content-friendly channels", () => {
    const organicPersona = buildPersona({
      preferredPlatforms: ["web", "youtube"],
      interests: ["cooking", "reviews", "how-to"],
      searchPatterns: ["best kitchen reviews", "how to meal prep"],
    });
    const paidPersona = buildPersona({
      preferredPlatforms: ["amazon"],
      interests: ["deals"],
      searchPatterns: ["cheap kitchen gadgets"],
      spendingPower: "budget",
      urgencyLevel: "low",
    });

    const organic = scoreBuyerReachability(organicPersona);
    const paidFocused = scoreBuyerReachability(paidPersona);

    assert.ok(organic.dimensions.organicReach >= paidFocused.dimensions.organicReach);
    assert.ok(
      organic.channels.find((channel) => channel.channelName === "YouTube")!.organicScore >= 60,
    );
  });

  it("scores paid reach higher for premium urgent personas", () => {
    const premiumPersona = buildPersona({
      spendingPower: "premium",
      urgencyLevel: "critical",
      preferredPlatforms: ["amazon", "instagram", "web"],
    });
    const budgetPersona = buildPersona({
      spendingPower: "budget",
      urgencyLevel: "low",
      preferredPlatforms: ["forums"],
    });

    const premium = scoreBuyerReachability(premiumPersona);
    const budget = scoreBuyerReachability(budgetPersona);

    assert.ok(premium.dimensions.paidReach > budget.dimensions.paidReach);
    assert.ok(premium.dimensions.expectedCost > budget.dimensions.expectedCost);
  });

  it("ranks channels by overall reach score", () => {
    const breakdown = scoreBuyerReachability(
      buildPersona({
        preferredPlatforms: ["amazon", "web"],
        searchPatterns: ["best kitchen & dining reviews"],
      }),
    );

    const ranks = breakdown.channels.map((channel) => channel.rank);
    const sortedScores = [...breakdown.channels]
      .sort((left, right) => right.overallReachScore - left.overallReachScore)
      .map((channel) => channel.channelName);

    assert.deepEqual(ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.deepEqual(breakdown.topChannels, sortedScores.slice(0, 3));
    assert.ok(
      breakdown.channels[0]!.overallReachScore >= breakdown.channels[1]!.overallReachScore,
    );
  });

  it("derives confidence from persona and reachability signals", () => {
    const strongPersona = buildPersona({ confidence: 90, urgencyLevel: "critical" });
    const weakPersona = buildPersona({
      confidence: 45,
      urgencyLevel: "low",
      preferredPlatforms: [],
      interests: [],
      searchPatterns: [],
    });

    const strong = scoreBuyerReachability(strongPersona);
    const weak = scoreBuyerReachability(weakPersona);

    assert.ok(strong.confidence > weak.confidence);
    assert.ok(strong.confidence >= 60);
    assert.ok(weak.confidence < strong.confidence);
  });

  it("persists reachability profiles in repository via module", async () => {
    const repository = createInMemoryReachabilityRepository();
    const module = createReachabilityModule(repository);
    const persona = buildPersona();

    const created = await module.persistProfile(WORKSPACE_ID, persona);
    const stored = await repository.getByPersonaId(WORKSPACE_ID, persona.personaId);
    const listed = await module.listProfiles(WORKSPACE_ID, { buyerPersonaId: persona.personaId });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.buyerPersonaId, persona.personaId);
    assert.equal(stored!.channels.length, 10);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.confidence, created.confidence);
  });
});
