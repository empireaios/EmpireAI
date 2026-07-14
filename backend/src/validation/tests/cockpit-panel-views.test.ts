import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { configureValidationEnvironment } from "../harness.js";
import {
  loadEnginePanelView,
  loadExecutiveHomeView,
  loadMissionCentreView,
} from "../../domain/services/cockpit-panel-views.js";

configureValidationEnvironment();

describe("Cockpit panel views (G4-02)", () => {
  it("returns six-field engine panel for supplier engine", () => {
    const panel = loadEnginePanelView("supplier", "ws_test");
    assert.equal(panel.engineId, "supplier");
    assert.ok(panel.currentState);
    assert.ok(panel.health);
    assert.ok(typeof panel.progress.percent === "number");
    assert.ok(panel.nextAction);
    assert.ok(panel.executiveAudit.summary);
    assert.ok(Array.isArray(panel.dependencies));
  });

  it("loads executive home with engine summaries", () => {
    const home = loadExecutiveHomeView("ws_test");
    assert.ok(home.command);
    assert.ok(home.portfolio);
    assert.equal(home.engineSummaries.length, 7);
    assert.equal(home.summaryCards.length, 10);
    assert.ok(home.nextExecutiveAction);
    assert.ok(Array.isArray(home.attentionItems));
    assert.ok(Array.isArray(home.executiveTimeline));
    assert.ok(home.dependencyGraph.nodes.length >= 7);
    assert.ok(home.summaryCards.every((c) => c.href));
  });

  it("loads mission centre with OMS data", () => {
    const missions = loadMissionCentreView("ws_test");
    assert.ok(missions.oms.activeObjective);
    assert.ok(Array.isArray(missions.missions));
    assert.ok(Array.isArray(missions.blockers));
  });
});
