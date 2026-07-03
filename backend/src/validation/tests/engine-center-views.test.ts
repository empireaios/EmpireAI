import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadEngineCenterView } from "../../domain/services/engine-center-views.js";
import { ENGINE_CENTER_IDS } from "../../domain/services/engine-center-views.js";

describe("Engine Center views (G4-04)", () => {
  for (const engineId of ENGINE_CENTER_IDS) {
    it(`loads eight-section engine center for ${engineId}`, () => {
      const center = loadEngineCenterView(engineId, "ws_test");
      assert.equal(center.engineId, engineId);
      assert.ok(center.route.startsWith("/cockpit"));
      assert.ok(center.sections.overview);
      assert.ok(center.sections.health);
      assert.ok(center.sections.currentActivity);
      assert.ok(center.sections.dependencies);
      assert.ok(center.sections.executiveAudit);
      assert.ok(center.sections.configuration);
      assert.ok(center.sections.futureExpansion);
      assert.ok(center.sections.nextActions);
      assert.ok(center.aiInsight);
      assert.ok(center.aiInsight.currentInsight);
      assert.ok(center.aiInsight.recommendedAction);
      assert.ok(center.aiInsight.reasoningSource);
      assert.equal(center.siblingEngines.length, ENGINE_CENTER_IDS.length - 1);
    });
  }
});
