import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  createAnalyticsIntelligenceModule,
  createInMemoryAnalyticsIntelligenceRepository,
  DASHBOARD_METRIC_CATEGORIES,
  GA4_EVENT_TYPES,
  generateAnalyticsBlueprint,
  META_PIXEL_EVENTS,
  TIKTOK_PIXEL_EVENTS,
} from "../../execution/analytics-intelligence/index.js";

const WORKSPACE_ID = "ws-m081";

function buildAnalyticsInput(storeId = randomUUID()) {
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

describe("Mission 081 Analytics Intelligence Engine", () => {
  it("generates analytics blueprint with safety flags", async () => {
    const module = createAnalyticsIntelligenceModule();
    const record = await module.persistBlueprint(WORKSPACE_ID, buildAnalyticsInput());

    assert.ok(record.blueprintId);
    assert.match(record.blueprintName, /Kitchen Blender Supply Co\./);
    assert.equal(record.blueprintOnly, true);
    assert.equal(record.liveApiEnabled, false);
    assert.equal(record.deploymentEnabled, false);
    assert.ok(record.confidence >= 70);
    assert.ok(record.signals.some((signal) => signal.signalType === "blueprint_composite"));
  });

  it("generates Google Analytics model blueprint", () => {
    const blueprint = generateAnalyticsBlueprint(buildAnalyticsInput());
    const ga = blueprint.googleAnalytics;

    assert.match(ga.measurementId, /^G-BLUEPRINT-/);
    assert.ok(ga.enabledEvents.length >= 5);
    assert.ok(ga.enabledEvents.every((event) => GA4_EVENT_TYPES.includes(event)));
    assert.equal(ga.consentMode, "required");
    assert.ok(ga.customDimensions.length >= 3);
  });

  it("generates Meta Pixel and TikTok Pixel models", () => {
    const blueprint = generateAnalyticsBlueprint(buildAnalyticsInput());

    assert.match(blueprint.metaPixel.pixelId, /^META-BLUEPRINT-/);
    assert.ok(blueprint.metaPixel.enabledEvents.every((event) => META_PIXEL_EVENTS.includes(event)));
    assert.equal(blueprint.metaPixel.consentRequired, true);
    assert.equal(blueprint.metaPixel.conversionApiEnabled, true);

    assert.match(blueprint.tikTokPixel.pixelId, /^TT-BLUEPRINT-/);
    assert.ok(
      blueprint.tikTokPixel.enabledEvents.every((event) => TIKTOK_PIXEL_EVENTS.includes(event)),
    );
    assert.equal(blueprint.tikTokPixel.eventsApiEnabled, true);
  });

  it("generates server-side events and conversion events", () => {
    const blueprint = generateAnalyticsBlueprint(buildAnalyticsInput());

    assert.ok(blueprint.serverSideEvents.length >= 4);
    assert.ok(blueprint.serverSideEvents.every((event) => event.source === "SERVER"));
    assert.ok(blueprint.serverSideEvents.every((event) => event.deduplicationKey.length > 0));

    assert.ok(blueprint.conversionEvents.length >= 4);
    assert.ok(blueprint.conversionEvents.some((event) => event.category === "PURCHASE"));
    assert.ok(blueprint.conversionEvents.every((event) => event.platforms.length >= 1));
  });

  it("generates funnels with staged benchmarks", () => {
    const blueprint = generateAnalyticsBlueprint(buildAnalyticsInput());

    assert.ok(blueprint.funnels.length >= 2);
    for (const funnel of blueprint.funnels) {
      assert.ok(funnel.stages.length >= 3);
      assert.ok(funnel.stages.every((stage) => stage.benchmarkRate >= 0));
      assert.equal(funnel.stages[0]!.order, 1);
    }
  });

  it("generates revenue attribution model", () => {
    const attribution = generateAnalyticsBlueprint(buildAnalyticsInput()).revenueAttribution;

    assert.ok(attribution.touchpointModels.length >= 3);
    assert.equal(attribution.defaultModel, "LAST_TOUCH");
    assert.ok(attribution.channels.length >= 5);
    assert.ok(attribution.revenueEvents.includes("purchase"));
    assert.ok(attribution.lookbackWindowDays >= 28);
  });

  it("generates dashboard metrics across categories", () => {
    const metrics = generateAnalyticsBlueprint(buildAnalyticsInput()).dashboardMetrics;

    assert.ok(metrics.length >= 6);
    for (const category of ["TRAFFIC", "CONVERSION", "REVENUE"] as const) {
      assert.ok(metrics.some((metric) => metric.category === category));
    }
    assert.ok(metrics.every((metric) => DASHBOARD_METRIC_CATEGORIES.includes(metric.category)));
  });

  it("persists analytics intelligence records in the repository", async () => {
    const repository = createInMemoryAnalyticsIntelligenceRepository();
    const module = createAnalyticsIntelligenceModule(repository);
    const input = buildAnalyticsInput();

    const saved = await module.persistBlueprint(WORKSPACE_ID, input);
    const loadedByStore = await module.getBlueprintByStore(WORKSPACE_ID, input.storeId);
    const loadedById = await module.getBlueprintRecord(WORKSPACE_ID, saved.recordId);

    assert.ok(loadedByStore);
    assert.ok(loadedById);
    assert.equal(loadedByStore!.confidence, saved.confidence);
    assert.equal(loadedById!.funnels.length, saved.funnels.length);

    const listed = await repository.list({
      workspaceId: WORKSPACE_ID,
      storeId: input.storeId,
    });
    assert.equal(listed.length, 1);
  });
});
