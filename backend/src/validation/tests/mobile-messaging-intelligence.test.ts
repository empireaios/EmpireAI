import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  AUDIENCE_SEGMENT_TYPES,
  createInMemoryMobileMessagingRepository,
  createMobileMessagingIntelligenceModule,
  generateMobileMessagingBlueprint,
  PUSH_NOTIFICATION_TYPES,
  SMS_CAMPAIGN_TYPES,
  validateMobileMessagingBlueprint,
} from "../../execution/mobile-messaging-intelligence/index.js";

const WORKSPACE_ID = "ws-m085";

function buildMessagingInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      slogan: "Quality you can ship today",
      niche: "Curated ecommerce essentials",
      targetAudience: "Online shoppers seeking fast, reliable product discovery",
      positioning: "Trusted direct-to-consumer category leader",
      confidence: 82,
    },
    offer: {
      offerTitle: "Premium Kitchen Blender Offer",
      headline: "Elevate your kitchen blender experience",
      valueProposition: "Premium positioning for curated ecommerce essentials.",
      keyBenefits: [
        "Premium positioning buyers trust immediately",
        "Higher perceived quality and brand credibility",
        "Stronger conversion for high-intent shoppers",
      ],
      callToAction: "Shop the premium offer",
      averageOrderValue: 49.99,
    },
    storeId,
    storeSlug: "kitchen-blender-supply-co",
  };
}

describe("Mission 085 Mobile Messaging Intelligence Engine", () => {
  it("generates mobile messaging blueprint with safety flags", async () => {
    const module = createMobileMessagingIntelligenceModule();
    const record = await module.persistBlueprint(WORKSPACE_ID, buildMessagingInput());

    assert.ok(record.blueprintId);
    assert.match(record.blueprintName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoSendEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "messaging_composite"));
  });

  it("generates all six SMS campaigns", () => {
    const blueprint = generateMobileMessagingBlueprint(buildMessagingInput());

    assert.equal(blueprint.smsCampaigns.length, 6);
    assert.deepEqual(
      blueprint.smsCampaigns.map((campaign) => campaign.campaignType),
      [...SMS_CAMPAIGN_TYPES],
    );

    for (const campaign of blueprint.smsCampaigns) {
      assert.ok(campaign.messageBody.length > 0);
      assert.ok(campaign.characterCount >= campaign.messageBody.length - 5);
      assert.ok(campaign.segmentCount >= 1);
      assert.ok(campaign.score >= 0 && campaign.score <= 100);
      assert.ok(["READY", "DRAFT"].includes(campaign.status));
    }
  });

  it("generates all six push notifications", () => {
    const blueprint = generateMobileMessagingBlueprint(buildMessagingInput());

    assert.equal(blueprint.pushNotifications.length, 6);
    assert.deepEqual(
      blueprint.pushNotifications.map((notification) => notification.notificationType),
      [...PUSH_NOTIFICATION_TYPES],
    );

    for (const notification of blueprint.pushNotifications) {
      assert.ok(notification.title.length > 0);
      assert.ok(notification.body.length > 0);
      assert.ok(notification.deepLink.startsWith("https://"));
      assert.ok(notification.score >= 0 && notification.score <= 100);
    }
  });

  it("generates timing rules with quiet hours", () => {
    const timingRules = generateMobileMessagingBlueprint(buildMessagingInput()).timingRules;

    assert.ok(timingRules.length >= 4);
    assert.ok(timingRules.some((rule) => rule.channel === "SMS"));
    assert.ok(timingRules.some((rule) => rule.channel === "PUSH"));
    assert.ok(timingRules.some((rule) => rule.channel === "BOTH"));

    for (const rule of timingRules) {
      assert.ok(rule.sendWindowLocal.length > 0);
      assert.ok(rule.optimalDays.length >= 1);
      assert.ok(rule.score >= 0 && rule.score <= 100);
    }
  });

  it("generates audience segmentation", () => {
    const segments = generateMobileMessagingBlueprint(buildMessagingInput()).segments;

    assert.equal(segments.length, 6);
    assert.deepEqual(
      segments.map((segment) => segment.segmentType),
      [...AUDIENCE_SEGMENT_TYPES],
    );

    for (const segment of segments) {
      assert.ok(segment.criteria.length > 0);
      assert.ok(segment.estimatedReachPercent >= 0);
      assert.ok(segment.preferredChannels.length >= 1);
    }
  });

  it("generates automation triggers disabled by default", () => {
    const triggers = generateMobileMessagingBlueprint(buildMessagingInput()).automationTriggers;

    assert.ok(triggers.length >= 6);
    assert.ok(triggers.every((trigger) => trigger.enabled === false));
    assert.ok(triggers.some((trigger) => trigger.event === "CART_ABANDONED"));
    assert.ok(triggers.some((trigger) => trigger.event === "ORDER_SHIPPED"));
    assert.ok(triggers.every((trigger) => trigger.segmentFilter.length > 0));
  });

  it("generates frequency controls for SMS and push", () => {
    const controls = generateMobileMessagingBlueprint(buildMessagingInput()).frequencyControls;

    assert.ok(controls.length >= 3);
    assert.ok(controls.some((control) => control.channel === "SMS"));
    assert.ok(controls.some((control) => control.channel === "PUSH"));

    for (const control of controls) {
      assert.ok(control.maxPerDay >= 0);
      assert.ok(control.maxPerWeek >= control.maxPerDay);
      assert.ok(control.minHoursBetween >= 0);
      assert.ok(control.promotionalCapPerWeek >= 0);
    }
  });

  it("computes weighted confidence signals", () => {
    const blueprint = generateMobileMessagingBlueprint(buildMessagingInput());

    assert.ok(blueprint.signals.length >= 6);
    const composite = blueprint.signals.find(
      (signal) => signal.signalType === "messaging_composite",
    );
    assert.ok(composite);
    assert.equal(composite!.score, blueprint.confidence);
  });

  it("validates mobile messaging blueprint schema", () => {
    const blueprint = generateMobileMessagingBlueprint(buildMessagingInput());
    const validated = validateMobileMessagingBlueprint({ blueprintId: randomUUID(), ...blueprint });

    assert.equal(validated.smsCampaigns.length, 6);
    assert.equal(validated.pushNotifications.length, 6);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoSendEnabled, false);
  });

  it("persists mobile messaging records in the repository", async () => {
    const repository = createInMemoryMobileMessagingRepository();
    const module = createMobileMessagingIntelligenceModule(repository);
    const input = buildMessagingInput();

    const saved = await module.persistBlueprint(WORKSPACE_ID, input);
    const loadedByStore = await module.getBlueprintByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getBlueprintRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.automationTriggers.length, saved.automationTriggers.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
