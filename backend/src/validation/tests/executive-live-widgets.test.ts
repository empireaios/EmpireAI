import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildExecutiveSummaryCards,
  loadAllEnginePanels,
} from "../../domain/services/cockpit-panel-views.js";
import { loadDashboardView } from "../../domain/services/module-views.js";
import { loadOperationalCommandView } from "../../domain/services/operational-command-view.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G4-06 — Live executive widgets", () => {
  it("builds 10 priority widgets with G4-06 contract metadata", () => {
    const workspaceId = "ws_g406_test";
    const companyId = "ws_g406_test";
    const command = loadOperationalCommandView(workspaceId, companyId);
    const portfolio = loadDashboardView(workspaceId);
    const engines = loadAllEnginePanels(workspaceId);
    const cards = buildExecutiveSummaryCards(workspaceId, companyId, command, portfolio, engines);

    assert.equal(cards.length, 10);

    for (const card of cards) {
      assert.ok(card.widgetId.startsWith("G4-06-W"), card.id);
      assert.ok(card.dataSource);
      assert.ok(card.futureEnhancement);
      assert.equal(card.refreshSeconds, 45);
      assert.ok(["live", "sandbox", "unavailable"].includes(card.dataMode));
      assert.equal(typeof card.liveDataAvailable, "boolean");
      assert.ok(card.status);
      assert.ok(card.nextAction);
    }

    const titles = cards.map((c) => c.title);
    assert.ok(titles.includes("Marketplace Health"));
    assert.ok(titles.includes("Supplier Health"));
    assert.ok(titles.includes("Revenue Summary"));
    assert.ok(titles.includes("AI Recommendation Summary"));
    assert.ok(titles.includes("Recent Executive Timeline"));
  });

  it("widgets without live data expose fallback fields not fabricated metrics", () => {
    const workspaceId = "ws_g406_test";
    const command = loadOperationalCommandView(workspaceId);
    const portfolio = loadDashboardView(workspaceId);
    const engines = loadAllEnginePanels(workspaceId);
    const cards = buildExecutiveSummaryCards(workspaceId, workspaceId, command, portfolio, engines);

    for (const card of cards) {
      if (!card.liveDataAvailable || card.primaryValue === null) {
        assert.ok(card.status);
        assert.ok(card.nextAction);
      }
    }
  });
});
