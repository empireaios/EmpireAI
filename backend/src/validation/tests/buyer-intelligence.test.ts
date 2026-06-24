import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BUYER_INTELLIGENCE_CAPABILITIES,
  BUYER_INTELLIGENCE_CATALOG_ENTRY,
  BUYER_INTELLIGENCE_MODULE_ID,
  BUYER_INTELLIGENCE_OBSERVATION_DOMAINS,
  BUYER_INTELLIGENCE_SCHEMA_SQL_SKETCH,
  BUYER_INTELLIGENCE_TABLES,
  isActiveAudienceSegment,
  isPurchaseReadyIntent,
  isPurchaseTriggerActiveAt,
  needCategoryMatchesDomain,
  normalizeBuyerPersonaSlug,
  urgencyWeight,
  validateAudienceSegment,
  validateBuyerIntent,
  validateBuyerPersona,
  validateNeedCategory,
  validatePurchaseTrigger,
} from "../../intelligence/buyer-intelligence/index.js";

const NOW = "2026-06-23T12:00:00.000Z";

describe("Mission 022 Buyer Intelligence — foundation", () => {
  it("exports module catalog metadata", () => {
    assert.equal(BUYER_INTELLIGENCE_MODULE_ID, "buyer-intelligence");
    assert.equal(BUYER_INTELLIGENCE_CATALOG_ENTRY.status, "foundation");
    assert.ok(BUYER_INTELLIGENCE_CAPABILITIES.length >= 10);
  });

  it("exports proposed schema artifacts", () => {
    assert.equal(BUYER_INTELLIGENCE_TABLES.buyerPersonas, "bi_buyer_personas");
    assert.ok(BUYER_INTELLIGENCE_SCHEMA_SQL_SKETCH.includes("bi_segment_memberships"));
    assert.ok(BUYER_INTELLIGENCE_OBSERVATION_DOMAINS.includes("trend"));
  });

  it("validates buyer persona model shape", () => {
    const persona = validateBuyerPersona({
      id: "bp-1",
      workspaceId: "ws-bi",
      name: "Budget-Conscious Parent",
      slug: "budget-conscious-parent",
      demographics: { ageRange: "30-45", incomeLevel: "middle" },
      psychographics: { values: ["family"], interests: ["home"], lifestyle: ["suburban"] },
      painPoints: ["high shipping costs"],
      goals: ["save time on meal prep"],
      sourceObservationIds: ["obs-1"],
      confidence: 72,
      tags: ["parent"],
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.equal(persona.slug, "budget-conscious-parent");
    assert.equal(normalizeBuyerPersonaSlug("  Budget Parent! "), "budget-parent");
  });

  it("validates intent helpers", () => {
    const intent = validateBuyerIntent({
      id: "bi-1",
      workspaceId: "ws-bi",
      stage: "purchase",
      urgency: "high",
      signals: [
        {
          signalType: "cart_abandon_recovery",
          source: "mock",
          strength: 80,
          detectedAt: NOW,
        },
      ],
      observationIds: ["obs-2"],
      needCategoryIds: ["nc-1"],
      confidence: 65,
      detectedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.ok(isPurchaseReadyIntent(intent.stage));
    assert.equal(urgencyWeight("high"), 0.75);
  });

  it("validates need category domain linkage", () => {
    const category = validateNeedCategory({
      id: "nc-1",
      workspaceId: "ws-bi",
      slug: "kitchen-convenience",
      label: "Kitchen Convenience",
      observationDomains: ["product", "trend"],
      priority: "high",
      keywords: ["blender", "meal prep"],
      confidence: 70,
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.ok(needCategoryMatchesDomain(category, "trend"));
    assert.equal(needCategoryMatchesDomain(category, "risk"), false);
  });

  it("validates purchase trigger window logic", () => {
    const trigger = validatePurchaseTrigger({
      id: "pt-1",
      workspaceId: "ws-bi",
      name: "Holiday Season",
      triggerType: "season",
      conditions: [{ field: "month", operator: "in", value: ["11", "12"] }],
      linkedNeedCategoryIds: ["nc-1"],
      strength: 85,
      observationIds: [],
      active: true,
      windowStart: "2026-11-01T00:00:00.000Z",
      windowEnd: "2026-12-31T23:59:59.000Z",
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.ok(isPurchaseTriggerActiveAt(trigger, "2026-12-15T00:00:00.000Z"));
    assert.equal(isPurchaseTriggerActiveAt(trigger, "2026-10-01T00:00:00.000Z"), false);
  });

  it("validates audience segment status helper", () => {
    const segment = validateAudienceSegment({
      id: "as-1",
      workspaceId: "ws-bi",
      name: "High Intent Parents",
      slug: "high-intent-parents",
      status: "active",
      ruleOperator: "and",
      rules: [{ field: "intent_stage", operator: "eq", value: "purchase" }],
      personaIds: ["bp-1"],
      needCategoryIds: ["nc-1"],
      intentStages: ["purchase"],
      tags: [],
      createdAt: NOW,
      updatedAt: NOW,
    });
    assert.ok(isActiveAudienceSegment(segment));
  });
});
