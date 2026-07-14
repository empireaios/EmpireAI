import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  MARKETPLACE_CONNECTOR_REGISTRY,
  MARKETPLACE_INTEGRATION_PIPELINE,
  MARKETPLACE_SYNC_DOMAINS,
  createMarketplaceIntegrationEngine,
  evaluateMarketplaceIntegrationGate,
  buildMarketplaceIntegrationReadinessPipelineSync,
} from "../../marketplace-integration/index.js";

describe("P8-03 Pillow Marketplace Integration", () => {
  test("connector registry covers mission marketplaces", () => {
    const ids = MARKETPLACE_CONNECTOR_REGISTRY.map((c) => c.connectorId);
    assert.ok(ids.includes("amazon"));
    assert.ok(ids.includes("shopify"));
    assert.ok(ids.includes("tiktok-shop"));
    assert.ok(ids.includes("meta-commerce"));
    assert.ok(ids.includes("cj-dropshipping"));
    assert.ok(ids.includes("temu"));
  });

  test("readiness pipeline passes with doctrine and registries", async () => {
    const bootstrap = await runBootstrap({ skipHeavyScans: true });
    const pipeline = buildMarketplaceIntegrationReadinessPipelineSync({
      bootstrap,
      request: { missionId: "P8-03", roadmapItem: "P8-03" },
    });
    assert.equal(pipeline.pipelineVersion, "P8-03");
    assert.equal(pipeline.success, true);
    const gate = evaluateMarketplaceIntegrationGate(pipeline);
    assert.equal(gate.allowed, true);
  });

  test("engine initializes and produces cockpit snapshot", async () => {
    const bootstrap = await runBootstrap({ skipHeavyScans: true });
    const engine = createMarketplaceIntegrationEngine(bootstrap);
    await engine.initialize();
    await engine.refreshReadiness({ missionId: "P8-03" });
    const assessment = engine.runAssessment();
    assert.equal(assessment.success, true);
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.executiveSummary.includes("Unified marketplace"));
    assert.equal(MARKETPLACE_INTEGRATION_PIPELINE.length, 11);
    assert.equal(MARKETPLACE_SYNC_DOMAINS.length, 9);
  });
});
