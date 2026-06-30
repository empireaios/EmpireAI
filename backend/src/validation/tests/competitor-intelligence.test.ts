import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  COMPETITOR_CHANGE_TYPES,
  COMPETITOR_WATCH_PROVIDER_ID,
  createCompetitorIntelligenceModule,
  createCompetitorWatchConnector,
  createInMemoryCompetitorIntelligenceRepository,
  detectChanges,
  generateAlertsFromChanges,
  generateCompetitorIntelligence,
  runCompetitorWatchCycle,
  validateCompetitorIntelligenceReport,
} from "../../eye/competitor-intelligence/index.js";

const WORKSPACE_ID = "ws-m087";

function buildCompetitorInput(storeId = randomUUID()) {
  return {
    brand: {
      brandId: randomUUID(),
      brandName: "Kitchen Blender Supply Co.",
      niche: "Curated ecommerce essentials",
      confidence: 82,
    },
    storeId,
    competitors: [
      {
        competitorName: "BlendMaster Direct",
        competitorDomain: "blendmaster.example",
        marketplace: "DTC",
        category: "Kitchen appliances",
      },
      {
        competitorName: "KitchenPro Store",
        competitorDomain: "kitchenpro.example",
        marketplace: "Amazon",
        category: "Kitchen appliances",
      },
    ],
  };
}

describe("Mission 087 Competitor Intelligence Engine", () => {
  it("generates competitor intelligence with safety flags", async () => {
    const module = createCompetitorIntelligenceModule();
    const record = await module.runBaselineWatch(WORKSPACE_ID, buildCompetitorInput());

    assert.ok(record.reportId);
    assert.match(record.reportName, /Kitchen Blender Supply Co\./);
    assert.equal(record.intelligenceOnly, true);
    assert.equal(record.liveApiEnabled, false);
    assert.ok(record.confidence >= 55);
    assert.ok(record.signals.some((signal) => signal.signalType === "competitor_composite"));
  });

  it("tracks competitors via competitor-watch connector", async () => {
    const report = await generateCompetitorIntelligence(WORKSPACE_ID, buildCompetitorInput());

    assert.ok(report.competitors.length >= 2);
    assert.equal(report.snapshots.length, report.competitors.length);
    assert.ok(report.snapshots.every((snapshot) => snapshot.mock));
    assert.ok(report.snapshots.every((snapshot) => snapshot.observationId.length > 0));
  });

  it("observes price, creative, landing page, offer, review, and bestseller fields", async () => {
    const snapshot = (await generateCompetitorIntelligence(WORKSPACE_ID, buildCompetitorInput()))
      .snapshots[0]!;

    assert.ok(snapshot.price > 0);
    assert.ok(snapshot.creativeHash.length > 0);
    assert.ok(snapshot.landingPageUrl.startsWith("https://"));
    assert.ok(snapshot.offerText.length > 0);
    assert.ok(snapshot.reviewCount >= 0);
    assert.ok(snapshot.reviewRating >= 0 && snapshot.reviewRating <= 5);
  });

  it("detects price changes between watch cycles", async () => {
    const input = buildCompetitorInput();
    const baseline = await generateCompetitorIntelligence(WORKSPACE_ID, input);

    const delta = await runCompetitorWatchCycle(WORKSPACE_ID, {
      ...input,
      watchCycle: 2,
      previousSnapshots: baseline.snapshots,
    });

    assert.ok(delta.changes.length >= 1);
    assert.ok(delta.changes.some((change) => change.changeType === "PRICE_CHANGE"));
  });

  it("detects creative, landing page, and offer changes", async () => {
    const input = buildCompetitorInput();
    const baseline = await generateCompetitorIntelligence(WORKSPACE_ID, input);

    const delta = await runCompetitorWatchCycle(WORKSPACE_ID, {
      ...input,
      watchCycle: 2,
      previousSnapshots: baseline.snapshots,
    });

    const changeTypes = new Set(delta.changes.map((change) => change.changeType));
    assert.ok(
      changeTypes.has("CREATIVE_CHANGE") ||
        changeTypes.has("LANDING_PAGE") ||
        changeTypes.has("OFFER"),
    );
  });

  it("generates alerts from detected changes", async () => {
    const input = buildCompetitorInput();
    const baseline = await generateCompetitorIntelligence(WORKSPACE_ID, input);

    const delta = await runCompetitorWatchCycle(WORKSPACE_ID, {
      ...input,
      watchCycle: 2,
      previousSnapshots: baseline.snapshots,
    });

    assert.equal(delta.alerts.length, delta.changes.length);
    for (const alert of delta.alerts) {
      assert.ok(COMPETITOR_CHANGE_TYPES.includes(alert.changeType));
      assert.ok(["HIGH", "MEDIUM", "LOW"].includes(alert.severity));
      assert.equal(alert.acknowledged, false);
      assert.ok(alert.title.length > 0);
      assert.ok(alert.description.includes("→"));
    }
  });

  it("change detection engine identifies review and bestseller deltas", () => {
    const previous = {
      snapshotId: randomUUID(),
      competitorId: "comp-1",
      competitorName: "Test Competitor",
      capturedAt: new Date().toISOString(),
      price: 49.99,
      currency: "USD",
      creativeHash: "cr-a",
      creativeSummary: "Ad A",
      landingPageUrl: "https://test.example/a",
      landingPageHash: "lp-a",
      offerText: "Offer A",
      reviewCount: 100,
      reviewRating: 4.2,
      bestsellerRank: 25,
      bestsellerCategory: "Kitchen",
      observationId: randomUUID(),
      mock: true,
    };

    const current = {
      ...previous,
      snapshotId: randomUUID(),
      observationId: randomUUID(),
      reviewCount: 120,
      reviewRating: 4.5,
      bestsellerRank: 12,
    };

    const changes = detectChanges(previous, current);
    assert.ok(changes.some((change) => change.changeType === "REVIEW"));
    assert.ok(changes.some((change) => change.changeType === "BEST_SELLER"));

    const alerts = generateAlertsFromChanges(changes);
    assert.equal(alerts.length, changes.length);
  });

  it("competitor-watch connector implements EyeConnector contract", async () => {
    const connector = createCompetitorWatchConnector();
    const workspaceId = WORKSPACE_ID;

    await connector.connect({ workspaceId, correlationId: randomUUID() });
    const health = await connector.healthCheck({ workspaceId, correlationId: randomUUID() });
    assert.equal(health.healthState, "healthy");
    assert.equal(connector.definition.providerId, COMPETITOR_WATCH_PROVIDER_ID);

    const observations = await connector.observe(
      { workspaceId, correlationId: randomUUID() },
      {
        domain: "market",
        query: {
          competitorId: "comp-test",
          competitorName: "Test Store",
          competitorDomain: "test.example",
          cycle: 1,
        },
      },
    );

    assert.equal(observations.length, 1);
    assert.equal(observations[0]!.mock, true);
    assert.equal(observations[0]!.providerId, COMPETITOR_WATCH_PROVIDER_ID);
  });

  it("validates competitor intelligence report schema", async () => {
    const report = await generateCompetitorIntelligence(WORKSPACE_ID, buildCompetitorInput());
    const validated = validateCompetitorIntelligenceReport({
      reportId: randomUUID(),
      ...report,
    });

    assert.ok(validated.competitors.length >= 1);
    assert.equal(validated.intelligenceOnly, true);
    assert.equal(validated.liveApiEnabled, false);
  });

  it("persists competitor intelligence and runs delta watch cycle", async () => {
    const repository = createInMemoryCompetitorIntelligenceRepository();
    const module = createCompetitorIntelligenceModule(repository);
    const input = buildCompetitorInput();

    const baseline = await module.runBaselineWatch(WORKSPACE_ID, input);
    assert.equal(baseline.changes.length, 0);

    const delta = await module.runDeltaWatch(WORKSPACE_ID, input);
    assert.ok(delta.changes.length >= 1);
    assert.ok(delta.alerts.length >= 1);

    const loaded = await module.getReportByStore(WORKSPACE_ID, input.storeId);
    assert.ok(loaded);
    assert.equal(loaded!.alerts.length, delta.alerts.length);
  });
});
