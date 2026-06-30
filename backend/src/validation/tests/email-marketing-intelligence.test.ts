import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createEmailMarketingIntelligenceModule,
  createInMemoryEmailMarketingRepository,
  EMAIL_FLOW_TYPES,
  generateEmailMarketingBlueprint,
  validateEmailMarketingBlueprint,
} from "../../execution/email-marketing-intelligence/index.js";

const WORKSPACE_ID = "ws-m084";

function buildEmailInput(storeId = randomUUID()) {
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
    calendarWeeks: 4,
  };
}

describe("Mission 084 Email Marketing Intelligence Engine", () => {
  it("generates email marketing blueprint with safety flags", async () => {
    const module = createEmailMarketingIntelligenceModule();
    const record = await module.persistBlueprint(WORKSPACE_ID, buildEmailInput());

    assert.ok(record.blueprintId);
    assert.match(record.blueprintName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.deploymentEnabled, false);
    assert.equal(record.autoSendEnabled, false);
    assert.ok(record.confidence >= 60);
    assert.ok(record.overallScore >= 60);
    assert.ok(record.signals.some((signal) => signal.signalType === "email_composite"));
  });

  it("generates all nine email flows", () => {
    const blueprint = generateEmailMarketingBlueprint(buildEmailInput());

    assert.equal(blueprint.flows.length, 9);
    assert.deepEqual(
      blueprint.flows.map((flow) => flow.flowType),
      [...EMAIL_FLOW_TYPES],
    );

    for (const flow of blueprint.flows) {
      assert.ok(flow.score >= 0 && flow.score <= 100);
      assert.ok(["READY", "DRAFT"].includes(flow.status));
      assert.ok(flow.trigger.length > 0);
      assert.ok(flow.sequenceLength >= 1);
    }
  });

  it("generates welcome, abandoned cart, and browse abandonment flows", () => {
    const flows = generateEmailMarketingBlueprint(buildEmailInput()).flows;

    const welcome = flows.find((flow) => flow.flowType === "WELCOME");
    const cart = flows.find((flow) => flow.flowType === "ABANDONED_CART");
    const browse = flows.find((flow) => flow.flowType === "BROWSE_ABANDONMENT");

    assert.ok(welcome);
    assert.ok(cart);
    assert.ok(browse);
    assert.equal(welcome!.sequenceLength, 3);
    assert.ok(cart!.subjectLines.some((line) => line.subject.includes("left")));
    assert.ok(browse!.emailCopy.length >= 2);
  });

  it("generates purchase confirmation and shipping flows", () => {
    const flows = generateEmailMarketingBlueprint(buildEmailInput()).flows;

    const purchase = flows.find((flow) => flow.flowType === "PURCHASE_CONFIRMATION");
    const shipping = flows.find((flow) => flow.flowType === "SHIPPING");

    assert.ok(purchase);
    assert.ok(shipping);
    assert.equal(purchase!.delayHours, 0);
    assert.ok(purchase!.emailCopy[0]!.bodyPlain.includes("confirmed"));
    assert.ok(shipping!.emailCopy[0]!.bodyPlain.includes("on its way"));
  });

  it("generates review request, upsell, VIP, and winback flows", () => {
    const flows = generateEmailMarketingBlueprint(buildEmailInput()).flows;

    const review = flows.find((flow) => flow.flowType === "REVIEW_REQUEST");
    const upsell = flows.find((flow) => flow.flowType === "UPSELL");
    const vip = flows.find((flow) => flow.flowType === "VIP");
    const winback = flows.find((flow) => flow.flowType === "WINBACK");

    assert.ok(review);
    assert.ok(upsell);
    assert.ok(vip);
    assert.ok(winback);
    assert.ok(review!.subjectLines.some((line) => line.subject.includes("review")));
    assert.ok(vip!.emailCopy[0]!.bodyPlain.includes("VIP"));
    assert.equal(winback!.sequenceLength, 3);
  });

  it("generates subject lines for every flow", () => {
    const blueprint = generateEmailMarketingBlueprint(buildEmailInput());

    for (const flow of blueprint.flows) {
      assert.ok(flow.subjectLines.length >= 1);
      for (const line of flow.subjectLines) {
        assert.ok(line.subject.length > 0);
        assert.ok(line.previewText.length > 0);
        assert.ok(line.score >= 0 && line.score <= 100);
        assert.equal(line.flowType, flow.flowType);
      }
    }
  });

  it("generates email copy for every flow step", () => {
    const blueprint = generateEmailMarketingBlueprint(buildEmailInput());

    for (const flow of blueprint.flows) {
      assert.equal(flow.emailCopy.length, flow.sequenceLength);
      for (const copy of flow.emailCopy) {
        assert.ok(copy.headline.length > 0);
        assert.ok(copy.bodyPlain.length > 0);
        assert.ok(copy.callToAction.length > 0);
        assert.ok(copy.score >= 0 && copy.score <= 100);
      }
    }
  });

  it("generates campaign calendar with PLANNED entries", () => {
    const calendar = generateEmailMarketingBlueprint(buildEmailInput()).campaignCalendar;

    assert.ok(calendar.length >= 9);
    assert.ok(calendar.every((entry) => entry.status === "PLANNED"));
    assert.ok(calendar.some((entry) => entry.flowType === "WELCOME"));
    assert.ok(calendar.some((entry) => entry.flowType === "WINBACK"));
    assert.ok(calendar.every((entry) => entry.sendWindowLocal.length > 0));
  });

  it("validates email marketing blueprint schema", () => {
    const blueprint = generateEmailMarketingBlueprint(buildEmailInput());
    const validated = validateEmailMarketingBlueprint({ blueprintId: randomUUID(), ...blueprint });

    assert.equal(validated.flows.length, 9);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.autoSendEnabled, false);
  });

  it("persists email marketing records in the repository", async () => {
    const repository = createInMemoryEmailMarketingRepository();
    const module = createEmailMarketingIntelligenceModule(repository);
    const input = buildEmailInput();

    const saved = await module.persistBlueprint(WORKSPACE_ID, input);
    const loadedByStore = await module.getBlueprintByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getBlueprintRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.overallScore, saved.overallScore);
    assert.equal(loadedById!.flows.length, 9);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
